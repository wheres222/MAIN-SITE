/**
 * Serialise a JSON-LD object for embedding in a <script> tag.
 *
 * `JSON.stringify` does not escape `<`, so a string anywhere in the graph that
 * contains a closing script tag ends the element early and everything after it
 * is parsed as HTML. The product and category schemas carry SellAuth-sourced
 * names and descriptions, which makes that reachable by whoever can edit the
 * catalogue.
 *
 * It matters more here than it would on most sites because the CSP in
 * next.config.ts allows `script-src 'unsafe-inline'` — required by Next's own
 * inline bootstrap — so an injected inline script would actually execute rather
 * than being blocked. On a site holding payment sessions that is account theft.
 *
 * Escaping to the \u form is the standard fix: JSON treats the escape as
 * identical to the literal character, so consumers parse exactly the same
 * object, while the HTML tokeniser never sees a `<`.
 *
 * U+2028 and U+2029 are handled for a separate reason — they are valid inside
 * a JSON string but are line terminators in a JavaScript string literal. They
 * are referenced by code point rather than written literally, because a raw
 * line separator sitting in a source file is exactly the kind of character that
 * tooling silently mangles.
 */
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEP]: "\\u2028",
  [PARA_SEP]: "\\u2029",
};

const UNSAFE = new RegExp("[<>&" + LINE_SEP + PARA_SEP + "]", "g");

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(UNSAFE, (c) => ESCAPES[c]);
}
