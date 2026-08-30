/**
 * Display formatting for category names.
 *
 * SellAuth names arrive however whoever typed them left them — "arc raiders",
 * "DMA", "hwid spoofers" — so the site showed a mix of casing. This puts them
 * all in title case without flattening names that are already correct.
 *
 * Two rules do the work:
 *
 *   1. Known acronyms map to their canonical form, so "dma" reads DMA.
 *   2. A word that already carries an uppercase letter past its first
 *      character is left exactly as it is. Without that, title-casing turns
 *      "CS2" into "Cs2" and "FiveM" into "Fivem" — the curated names in
 *      category-images.ts include "CS2", so this is not hypothetical.
 */

/** Lowercased word -> the form it should display as. */
const ACRONYMS = new Map<string, string>([
  ["dma", "DMA"],
]);

/** Joiners that stay lowercase mid-name, as title case normally treats them. */
const MINOR_WORDS = new Set(["of", "and", "the", "for", "in", "on", "to", "a", "an"]);

function formatWord(word: string, index: number): string {
  if (!word) return word;

  const acronym = ACRONYMS.get(word.toLowerCase());
  if (acronym) return acronym;

  // Already-cased names are left alone: anything with a capital past the first
  // character was deliberate ("CS2", "FiveM", "HWID", "PUBG").
  if (/[A-Z]/.test(word.slice(1))) return word;

  const lower = word.toLowerCase();
  if (index > 0 && MINOR_WORDS.has(lower)) return lower;

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function formatCategoryName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return trimmed;

  // Split on whitespace but keep hyphenated words intact, then case each side
  // of the hyphen ("counter-strike" -> "Counter-Strike").
  return trimmed
    .split(/\s+/)
    .map((word, index) =>
      word
        .split("-")
        .map((part, partIndex) => formatWord(part, index + partIndex))
        .join("-")
    )
    .join(" ");
}
