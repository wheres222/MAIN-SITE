/**
 * CheatParadise — Status Discord Bot
 *
 * Slash commands:
 *   /setstatus  product:<name> status:<undetected|updating|detected> [note:<text>]
 *   /clearstatus product:<name>
 *
 * On every status change the bot also posts a formatted embed in
 * DISCORD_STATUS_CHANNEL_ID so the whole team can see updates.
 *
 * Setup:
 *   1. cp .env.example .env  →  fill in values
 *   2. npm install
 *   3. node bot.js
 */

"use strict";

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActivityType,
  PermissionFlagsBits,
} = require("discord.js");

// ─── Load env ─────────────────────────────────────────────────────────────
require("fs").existsSync(".env") && require("fs")
  .readFileSync(".env", "utf8")
  .split("\n")
  .forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  });

const TOKEN                    = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID                = process.env.DISCORD_CLIENT_ID;
const GUILD_ID                 = process.env.DISCORD_GUILD_ID;              // optional
const STATUS_CHANNEL_ID        = process.env.DISCORD_STATUS_CHANNEL_ID;    // where embeds go
const WEBHOOK_UPDATES_CHANNEL  = process.env.WEBHOOK_UPDATES_CHANNEL_ID;   // auto-listener source
const ALLOWED_ROLE_ID          = process.env.ALLOWED_ROLE_ID;               // optional role gate
const SITE_URL                 = (process.env.SITE_URL || "https://cheatparadise.com").replace(/\/$/, "");
const BOT_API_KEY              = process.env.BOT_API_KEY;

if (!TOKEN || !CLIENT_ID || !BOT_API_KEY) {
  console.error("Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or BOT_API_KEY in .env");
  process.exit(1);
}

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_META = {
  undetected: { label: "UNDETECTED", color: 0x2fe496, emoji: "🟢", dot: "🟢" },
  updating:   { label: "UPDATING",   color: 0x62abff, emoji: "🔵", dot: "🔵" },
  detected:   { label: "DETECTED",   color: 0xff8a9f, emoji: "🔴", dot: "🔴" },
};

// ─── Slash command definitions ─────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("setstatus")
    .setDescription("Set the detection status for a product — updates the site instantly")
    .addStringOption((opt) =>
      opt
        .setName("product")
        .setDescription("Product name (start typing for suggestions)")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("status")
        .setDescription("Detection status")
        .setRequired(true)
        .addChoices(
          { name: "🟢  Undetected — safe to use", value: "undetected" },
          { name: "🔵  Updating   — temporarily offline", value: "updating" },
          { name: "🔴  Detected   — do NOT use", value: "detected" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("note")
        .setDescription("Optional note shown on the status page (e.g. 'Patch 8.2 triggered detection')")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("clearstatus")
    .setDescription("Revert a product to auto-inferred status (removes manual override)")
    .addStringOption((opt) =>
      opt
        .setName("product")
        .setDescription("Product name (start typing for suggestions)")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  new SlashCommandBuilder()
    .setName("liststatus")
    .setDescription("Show all active manual status overrides"),
];

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Fetch product list from the site catalog for autocomplete. */
let productCache = [];
let productCacheAt = 0;

async function getProducts(query = "") {
  // Refresh cache every 5 minutes
  if (Date.now() - productCacheAt > 5 * 60 * 1000) {
    try {
      const res = await fetch(`${SITE_URL}/api/catalog`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      productCache = Array.isArray(data.products) ? data.products : [];
      productCacheAt = Date.now();
    } catch {
      // keep stale cache on failure
    }
  }

  const q = query.trim().toLowerCase();
  const list = q
    ? productCache.filter((p) => p.name.toLowerCase().includes(q))
    : productCache;

  return list.slice(0, 25);
}

/** Build the value string sent back from autocomplete (encodes id + name). */
function encodeProduct(product) {
  return `${product.id}::${product.name}`;
}

/** Decode the autocomplete value. */
function decodeProduct(raw) {
  if (raw.includes("::")) {
    const idx = raw.indexOf("::");
    return { id: raw.slice(0, idx), name: raw.slice(idx + 2) };
  }
  return { id: raw, name: raw };
}

/** POST /api/admin/product-statuses */
async function apiSetStatus(productId, productName, status, note) {
  const res = await fetch(`${SITE_URL}/api/admin/product-statuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BOT_API_KEY}`,
    },
    body: JSON.stringify({ product_id: productId, product_name: productName, status, note: note || null }),
    signal: AbortSignal.timeout(10_000),
  });
  return { ok: res.ok, status: res.status };
}

/** DELETE /api/admin/product-statuses */
async function apiClearStatus(productId, productName) {
  const res = await fetch(
    `${SITE_URL}/api/admin/product-statuses?product_id=${encodeURIComponent(productId)}&product_name=${encodeURIComponent(productName)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${BOT_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    },
  );
  return { ok: res.ok, status: res.status };
}

/** GET /api/product-statuses (public) */
async function apiListStatuses() {
  const res = await fetch(`${SITE_URL}/api/product-statuses`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  return res.json();
}

/** Check if the member is allowed to run status commands. */
function isAuthorised(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (ALLOWED_ROLE_ID && member.roles.cache.has(ALLOWED_ROLE_ID)) return true;
  return false;
}

/** Post a status-update embed to the configured channel. */
async function postStatusEmbed(client, { productName, status, note, userId, cleared }) {
  if (!STATUS_CHANNEL_ID) return;
  const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased()) return;

  const cfg = STATUS_META[status];
  const embed = new EmbedBuilder()
    .setColor(cleared ? 0x8e98ab : cfg?.color ?? 0x8e98ab)
    .setTitle(
      cleared
        ? `⚪ Status Cleared — ${productName}`
        : `${cfg?.emoji ?? "❓"} Status Update — ${productName}`,
    )
    .setTimestamp()
    .setFooter({ text: "CheatParadise · Status Board" });

  if (!cleared && cfg) {
    embed.addFields({ name: "Status", value: `${cfg.emoji} ${cfg.label}`, inline: true });
  }
  if (cleared) {
    embed.addFields({ name: "Action", value: "Reverted to auto-inferred", inline: true });
  }
  if (userId) {
    embed.addFields({ name: "Updated by", value: `<@${userId}>`, inline: true });
  }
  if (note) {
    embed.addFields({ name: "Note", value: note });
  }

  await channel.send({ embeds: [embed] }).catch(console.error);
}

// ─── Register slash commands ───────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const route = GUILD_ID
    ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    : Routes.applicationCommands(CLIENT_ID);

  await rest.put(route, { body: commands.map((c) => c.toJSON()) });
  console.log(`✅ Slash commands registered (${GUILD_ID ? "guild" : "global"})`);
}

// ─── Client ────────────────────────────────────────────────────────────────
// GuildMessages + MessageContent are privileged intents — enable them in the
// Discord Developer Portal → Bot → Privileged Gateway Intents.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("cheatparadise.com/status", { type: ActivityType.Watching });
  await registerCommands().catch((err) => {
    console.error("Failed to register commands:", err.message);
  });
});

client.on("interactionCreate", async (interaction) => {
  // ── Autocomplete ──
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused();
    try {
      const products = await getProducts(focused);
      await interaction.respond(
        products.map((p) => ({ name: p.name, value: encodeProduct(p) })),
      );
    } catch {
      await interaction.respond([]).catch(() => {});
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // ── Permission check ──
  if (!isAuthorised(interaction.member)) {
    await interaction.reply({
      content: "❌ You need **Manage Server** permission (or the configured role) to use status commands.",
      ephemeral: true,
    });
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // /setstatus
  // ─────────────────────────────────────────────────────────────
  if (interaction.commandName === "setstatus") {
    await interaction.deferReply({ ephemeral: true });

    const raw    = interaction.options.getString("product", true);
    const status = interaction.options.getString("status", true);
    const note   = interaction.options.getString("note") ?? null;
    const { id: productId, name: productName } = decodeProduct(raw);
    const cfg = STATUS_META[status];

    let result;
    try {
      result = await apiSetStatus(productId, productName, status, note);
    } catch (err) {
      await interaction.editReply(`❌ Network error: ${err.message}`);
      return;
    }

    if (!result.ok) {
      await interaction.editReply(
        `❌ API returned ${result.status}. Check that BOT_API_KEY matches the Vercel env var.`,
      );
      return;
    }

    await interaction.editReply(
      `✅ **${productName}** → ${cfg?.emoji ?? ""} **${cfg?.label ?? status.toUpperCase()}**${note ? `\n> ${note}` : ""}`,
    );

    await postStatusEmbed(client, {
      productName,
      status,
      note,
      userId: interaction.user.id,
      cleared: false,
    });
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // /clearstatus
  // ─────────────────────────────────────────────────────────────
  if (interaction.commandName === "clearstatus") {
    await interaction.deferReply({ ephemeral: true });

    const raw = interaction.options.getString("product", true);
    const { id: productId, name: productName } = decodeProduct(raw);

    let result;
    try {
      result = await apiClearStatus(productId, productName);
    } catch (err) {
      await interaction.editReply(`❌ Network error: ${err.message}`);
      return;
    }

    if (!result.ok) {
      await interaction.editReply(`❌ API returned ${result.status}.`);
      return;
    }

    await interaction.editReply(`✅ **${productName}** reverted to auto-inferred status.`);

    await postStatusEmbed(client, {
      productName,
      status: null,
      note: null,
      userId: interaction.user.id,
      cleared: true,
    });
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // /liststatus
  // ─────────────────────────────────────────────────────────────
  if (interaction.commandName === "liststatus") {
    await interaction.deferReply({ ephemeral: true });

    let rows;
    try {
      rows = await apiListStatuses();
    } catch {
      await interaction.editReply("❌ Could not fetch status list.");
      return;
    }

    if (!rows.length) {
      await interaction.editReply("No manual overrides active. All statuses are auto-inferred.");
      return;
    }

    const lines = rows.map((r) => {
      const cfg = STATUS_META[r.status];
      const when = r.updated_at
        ? new Date(r.updated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "?";
      return `${cfg?.emoji ?? "❓"} **${r.product_name ?? r.product_id}** — ${cfg?.label ?? r.status} (${when})`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x62abff)
      .setTitle("Active Status Overrides")
      .setDescription(lines.join("\n"))
      .setTimestamp()
      .setFooter({ text: `${rows.length} override${rows.length !== 1 ? "s" : ""} · CheatParadise` });

    await interaction.editReply({ embeds: [embed] });
    return;
  }
});

// ─── Auto-listener: "Webhook Bot Updates" channel ─────────────────────────
//
// Parses the standard "Status Change" embed format:
//   Title:  "Status Change"
//   Fields: Product | Changed from | New Status
//
// On match → upserts to product_statuses via the same API the slash commands
// use. No manual intervention needed; fires the moment the webhook posts.

/** Convert "Ancient - Fortnite External" → "ancient-fortnite-external" */
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Strip emoji codepoints and surrounding whitespace from an embed field value,
 * then map to our internal status kind.
 */
function parseEmbedStatus(raw) {
  // Remove all emoji / unicode symbols, collapse whitespace
  const clean = raw
    .replace(/\p{Emoji_Presentation}/gu, "")
    .replace(/[​-‍﻿]/g, "")
    .trim()
    .toLowerCase();

  if (clean.includes("undetected")) return "undetected";
  if (clean.includes("updating") || clean.includes("update")) return "updating";
  if (clean.includes("detected")) return "detected";
  return null;
}

client.on("messageCreate", async (message) => {
  // Only care about the configured "Webhook Bot Updates" channel
  if (!WEBHOOK_UPDATES_CHANNEL) return;
  if (message.channelId !== WEBHOOK_UPDATES_CHANNEL) return;
  if (!message.embeds?.length) return;

  const embed = message.embeds[0];

  // Guard: must be a "Status Change" embed
  if (!embed.title || !embed.title.toLowerCase().includes("status change")) return;

  const fields = embed.fields ?? [];
  const productField   = fields.find((f) => f.name?.toLowerCase().includes("product"));
  const newStatusField = fields.find((f) => f.name?.toLowerCase().includes("new status"));

  if (!productField || !newStatusField) return;

  const productName = productField.value.trim();
  const newStatus   = parseEmbedStatus(newStatusField.value);

  if (!productName || !newStatus) {
    console.warn(`[listener] Could not parse embed — product="${productName}" status="${newStatusField.value}"`);
    return;
  }

  const productId = toSlug(productName);

  console.log(`[listener] Auto-update → "${productName}" (${productId}) = ${newStatus}`);

  try {
    const result = await apiSetStatus(productId, productName, newStatus, null);
    if (result.ok) {
      console.log(`[listener] ✅ Site updated for "${productName}"`);
    } else {
      console.error(`[listener] ❌ API returned ${result.status} for "${productName}"`);
    }
  } catch (err) {
    console.error(`[listener] ❌ Network error updating "${productName}":`, err.message);
  }
});

// ─── Error handling ────────────────────────────────────────────────────────
client.on("error", (err) => console.error("Discord client error:", err));
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));

// ─── Connect ───────────────────────────────────────────────────────────────
client.login(TOKEN).catch((err) => {
  console.error("Failed to login:", err.message);
  process.exit(1);
});
