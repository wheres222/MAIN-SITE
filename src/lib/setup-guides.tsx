import type { ReactNode } from "react";
import { Code, Download, Ext, Figure, Note, Step, Warn } from "@/components/guide-blocks";

/**
 * The general setup guides, listed under "Setup Guide" at the top of the /guide
 * sidebar. Per-product guides live in @/lib/product-guides.
 *
 * A section with `content: null` renders the "coming soon" placeholder, so new
 * tabs can be stubbed out here before they are written.
 */
export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: ReactNode;
}

// ── Downloads ────────────────────────────────────────────────────────────────

const DOWNLOADS = (
  <>
    <h3>Runtimes — install both</h3>
    <p>
      A missing runtime is the single most common reason a loader closes the moment you open it.
    </p>

    <Download title="DirectX End-User Runtime" href="https://www.microsoft.com/en-us/download/details.aspx?id=53337">
      Microsoft&apos;s official web installer.
    </Download>

    <Download
      title="Visual C++ Redistributable Runtimes"
      href="https://www.techpowerup.com/download/visual-c-redistributable-runtime-package-all-in-one/"
    >
      All-in-one package covering every version.
    </Download>

    <h3>Disabling your antivirus</h3>
    <Download title="Defender Control (dControl)" href="https://www.sordum.org/9480/defender-control-v2-1/">
      Turns Windows Defender fully off, which the settings toggle alone does not do.
    </Download>

    <h3>Overlay — pick the one that matches your GPU</h3>
    <p>
      Every product needs a working overlay to draw its menu. Install the one for your graphics card
      and set it up before you inject.
    </p>

    <Download title="NVIDIA App — for NVIDIA GPUs" href="https://www.nvidia.com/en-us/software/nvidia-app/">
      Skip if you already have it installed.
    </Download>
    <p>
      Then open the NVIDIA App → <strong>Settings</strong> → <strong>General</strong> → enable{" "}
      <strong>In-Game Overlay</strong>.
    </p>

    <Download title="SteelSeries GG — for AMD GPUs" href="https://steelseries.com/gg/download/">
      Provides the Sonar overlay these products hook into.
    </Download>
    <Step n={1} title="Turn on Sonar">
      Open SteelSeries GG → <strong>General</strong> → turn Sonar on.
    </Step>
    <Step n={2} title="Bind the volume shortcut">
      Go to <strong>Sonar</strong> → <strong>Shortcuts</strong> and bind <strong>F7</strong> to
      &quot;Master - Volume Up&quot;.
    </Step>
    <Warn>
      You must press <strong>F7</strong> before injecting, or the SteelSeries overlay will not be
      active and the menu will not draw.
    </Warn>

    <Note>
      Restart your PC after installing these. If a loader still closes instantly afterwards, work
      through <strong>Loader Crashing Fixes</strong>.
    </Note>
  </>
);

// ── Installing the loader ────────────────────────────────────────────────────

const INSTALLING_THE_LOADER = (
  <>
    <h3>Download being blocked by your browser</h3>
    <p>If the download is stopped before it ever reaches your disk, work through these in order.</p>

    <Step n={1} title="Disable browser security" />
    <Step n={2} title="Disable Windows SmartScreen" />
    <Step n={3} title="Create an antivirus exclusion for a folder">
      Give the folder a random name.
    </Step>
    <Step n={4} title="Download the product to that folder" />

    <Figure
      src="/guides/download-blocked.png"
      alt="Microsoft Edge showing a downloaded .zip blocked as unsafe by Microsoft Defender SmartScreen"
      caption="What the block looks like in Edge."
    />

    <Note>
      <strong>Reason:</strong> since cheats often modify memory, inject code, or hook functions, they
      share behavioural similarity with malware like trojans or RATs. Heuristic analysis spots this
      &quot;suspicious&quot; behaviour — modifying another process&apos;s memory — and raises a red
      flag, even though you authorised the action.
    </Note>
  </>
);

// ── Hyper-V / VBS ────────────────────────────────────────────────────────────

const DISABLE_HYPERV = (
  <>
    <p>
      Virtualization-based security is on by default in Windows 10 and 11, and it stops most loaders
      from working. Some loaders will try to disable Hyper-V for you and fail with this:
    </p>

    <Figure
      src="/guides/hyperv.png"
      alt="Error dialog reading: Failed to create a restore point to perform a safe Hyper-V disabling. Please disable Hyper-V manually using dgreadiness tool"
      caption="If you see this, disable it manually using the steps below."
    />

    <h3>Check whether VBS is enabled</h3>
    <Step n={1} title="Open System Information">
      Search for it in Windows search.
    </Step>
    <Step n={2} title="Find the Virtualization-based security row">
      Scroll down to it. If it says <strong>running</strong>, VBS is enabled.
    </Step>

    <h3>Disable it</h3>
    <Step n={1} title="Open Core Isolation">
      Search for &quot;Core Isolation&quot; in Windows search, or open it from System Settings.
    </Step>
    <Step n={2} title="Turn off Memory Integrity" />
    <Step n={3} title="Restart" />
    <Step n={4} title="Check again">
      Reopen System Information. Virtualization-based security should now read{" "}
      <strong>not enabled</strong>.
    </Step>

    <h3>If VBS is still enabled</h3>
    <Warn>
      This part edits the registry. Admin access and some experience are required — a wrong value
      here can stop Windows booting.
    </Warn>
    <Step n={1} title="Open regedit" />
    <Step n={2} title="Navigate to DeviceGuard">
      <code>Computer\HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\DeviceGuard</code>
    </Step>
    <Step n={3} title="Set EnableVirtualizationBasedSecurity to 0" />
    <Step n={4} title="Close regedit and restart" />

    <h3>If it is still running after that</h3>
    <p>With Memory Integrity already off, set both of these values to <code>0</code>, then restart:</p>
    <Code>{`HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity  ->  Enabled = 0
HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\WindowsHello  ->  Enabled = 0`}</Code>
    <p>Check System Information once more — VBS should not be running.</p>
  </>
);

// ── Troubleshooting ──────────────────────────────────────────────────────────

const TROUBLESHOOTING = (
  <>
    <p>Work through these in order before opening a ticket. Most problems are solved by step 3 or 4.</p>

    <Step n={1} title="Restart your computer and try again" />
    <Step n={2} title="Install Microsoft Visual C++">
      <Ext href="https://aka.ms/vs/17/release/vc_redist.x64.exe">vc_redist.x64.exe</Ext>
    </Step>
    <Step n={3} title="Completely disable Windows Defender">
      Use <Ext href="https://www.sordum.org/9480/defender-control-v2-1">Defender Control</Ext>.
    </Step>
    <Step n={4} title="Uninstall any other antivirus software">
      Including Windows Defender itself.
    </Step>
    <Step n={5} title="Uninstall FaceIt, Vanguard and ESEA">
      These anti-cheats always run in the background.
    </Step>
    <Step n={6} title="Remove overclocking">
      Disable any overclock and uninstall tools like MSI Afterburner. Reset BIOS settings to default
      if needed — see <strong>Entering the BIOS</strong> below.
    </Step>
    <Step n={7} title="Disable Memory Integrity">
      Windows Device Security → Core isolation.
    </Step>
    <Step n={8} title="Last resort — reinstall Windows">
      Only after everything above. Reinstall from a USB stick rather than Windows Settings, keeping
      your files.
    </Step>

    <h3>Entering the BIOS</h3>
    <p>
      Several of the steps above and in the product guides need BIOS changes. To get in: reboot, and
      as soon as the manufacturer&apos;s logo appears press the setup key repeatedly — usually{" "}
      <strong>F1</strong>, <strong>F2</strong>, <strong>Del</strong>, <strong>F10</strong>,{" "}
      <strong>F12</strong> or <strong>Esc</strong>. Navigate with the arrow keys and Enter.
    </p>
    <Warn>Save before exiting the BIOS, or your changes will be discarded.</Warn>
  </>
);

// ── Loader crashing ──────────────────────────────────────────────────────────

const LOADER_CRASHING = (
  <>
    <h3>First checks</h3>
    <ul className="guide-list">
      <li>Use a VPN — ProtonVPN and Windscribe both have free tiers.</li>
      <li>Sync your Date &amp; Time settings.</li>
      <li>Try a different network.</li>
      <li>Re-download the file.</li>
      <li>Restart your PC.</li>
    </ul>

    <h3>Antivirus and anti-cheat interference</h3>
    <p>
      Background security software is a frequent cause. Identify the offending program, then
      uninstall it from Windows&apos; installed programs list.
    </p>
    <p>If it will not uninstall, open Command Prompt as administrator and stop it by service name:</p>
    <Code>{`sc stop vgk
sc delete vgk`}</Code>
    <p>
      Replace <code>vgk</code> with the service you are removing.
    </p>

    <Note>
      If none of this works, open a support ticket in Discord and say which steps you have already
      tried.
    </Note>
  </>
);

// ── Bans ─────────────────────────────────────────────────────────────────────

const AVOIDING_BANS = (
  <>
    <p>How to avoid picking up any kind of ban.</p>

    <h3>New to our products?</h3>
    <ul className="guide-list">
      <li>
        Coming from another provider, use a fresh account that has never had other software run on
        it, and delete everything related to the old provider from your PC.
      </li>
      <li>
        You <em>can</em> use our software on an account that ran other software before, but late
        bans and detections can land months later. We have seen users switch over on an old account,
        get permanently banned, and assume ours was detected — starting clean fixed it.
      </li>
    </ul>

    <h3>Play like you are being watched 24/7</h3>
    <ul className="guide-list">
      <li>
        The most common way to get banned is playing obviously. 100+ kills every game on a fresh
        account with no trust will get you some kind of ban.
      </li>
      <li>
        AI anti-cheat keeps getting better. Watching people through walls, pre-firing, no map
        awareness but perfect aim, always knowing where people are — that gets you flagged by the AI
        and reported by players. You can get away with it occasionally; doing it constantly you will
        not.
      </li>
    </ul>

    <h3>Ranked play</h3>
    <Warn>
      Ranked is the easiest place to pick up a ban. If you are not experienced at legit cheating,
      avoid it entirely — it is basically a trap.
    </Warn>
    <ul className="guide-list">
      <li>
        Play ranked as though you were legit. Many people think they are, but have zero map awareness
        and rely on ESP constantly alongside god-like aim.
      </li>
      <li>Losing matches is fine. Not even pros win every ranked game.</li>
      <li>
        Our software is undetected and a solid choice for ranked, but ranked players should take the
        section above especially seriously.
      </li>
    </ul>

    <h3>What is account trust?</h3>
    <ul className="guide-list">
      <li>
        A fresh or ranked-ready account with little playtime and no history has zero trust, which
        makes a ban or an AI flag far more likely.
      </li>
      <li>
        Trust is earned by playing matches with little suspicious behaviour and no reports. Public
        matches and regular multiplayer are the fastest place to build it.
      </li>
      <li>
        A shadow ban resets your trust even on an aged account. When it lifts, go back to public
        matches with nothing loaded, play legit, and accept some losses. Going straight back into
        ranked playing the way you did before will get you shadowed again much faster.
      </li>
    </ul>
  </>
);

// ── Section list ─────────────────────────────────────────────────────────────

export const SETUP_SECTIONS: GuideSection[] = [
  { id: "downloads",       title: "Downloads",               icon: "⬇️", content: DOWNLOADS },
  { id: "installation",    title: "Installing the Loader",   icon: "⚙️", content: INSTALLING_THE_LOADER },
  { id: "disable-hyperv",  title: "Disabling Hyper-V",       icon: "🧩", content: DISABLE_HYPERV },
  { id: "troubleshooting", title: "General Troubleshooting", icon: "🔧", content: TROUBLESHOOTING },
  { id: "loader-crashing", title: "Loader Crashing Fixes",   icon: "💥", content: LOADER_CRASHING },
  { id: "avoiding-bans",   title: "Avoiding Bans",           icon: "🛡️", content: AVOIDING_BANS },
  { id: "hwid-spoofer",    title: "HWID Spoofer Guide",      icon: "🔀", content: null },
];
