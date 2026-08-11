/**
 * Attack-signature matching.
 *
 * Pure functions only — no I/O, no imports with side effects. This module runs
 * inside src/proxy.ts on every request, so anything slow or throwing here costs
 * every visitor. Keep it to string work.
 *
 * The patterns are deliberately specific. A loose match like /union/ or /select/
 * would fire on ordinary product searches; the cost of a false positive is a
 * junk Discord alert at 3am, so precision beats recall here.
 */

export type Severity = "low" | "medium" | "high";

export type EventKind =
  | "scanner_path"
  | "scanner_ua"
  | "sqli_attempt"
  | "xss_attempt"
  | "traversal_attempt"
  | "admin_access"
  | "admin_denied"
  | "preview_secret_failed"
  | "ip_blocked"
  | "account_moderated"
  | "auth_failure"
  | "auth_failure_burst"
  | "rate_limited"
  | "not_found"
  | "not_found_sweep";

export interface Detection {
  kind: EventKind;
  severity: Severity;
  detail: Record<string, unknown>;
}

/** Paths nobody on a Next.js storefront has any legitimate reason to request. */
const SCANNER_PATHS: RegExp[] = [
  /^\/wp-(admin|login|content|includes|json)/i,
  /^\/xmlrpc\.php/i,
  /\/\.env(\.|$)/i,
  /\/\.git(\/|$)/i,
  /\/\.aws(\/|$)/i,
  /\/\.ssh(\/|$)/i,
  /^\/phpmyadmin/i,
  /^\/pma\//i,
  /^\/adminer/i,
  /^\/cgi-bin\//i,
  /^\/vendor\/phpunit/i,
  /^\/solr\//i,
  /^\/actuator\//i,
  /\/(config|configuration|settings)\.(php|json|yml|yaml|bak)$/i,
  /\.(sql|bak|old|swp|tar\.gz|zip)$/i,
  /^\/server-status/i,
  /^\/\.well-known\/security\.txt$/i, // benign, but a reliable scan marker
];

/** Automated tooling that identifies itself. Real browsers never send these. */
const SCANNER_UA: RegExp[] =
  [/sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /nuclei/i, /acunetix/i, /wpscan/i,
   /dirbuster/i, /gobuster/i, /feroxbuster/i, /havij/i, /zgrab/i, /netsparker/i,
   /qualys/i, /openvas/i, /w3af/i, /arachni/i, /metasploit/i];

// Separators are [\s/*+] throughout: "+" because encoded query strings use it
// for spaces, "/**/" because that is the classic comment-based space evasion.
const SQLI: RegExp[] = [
  /\bunion[\s/*+]+select\b/i,
  /\bor\b[\s+]+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /\b(sleep|benchmark|pg_sleep)\s*\(/i,
  /\bwaitfor[\s+]+delay\b/i,
  /\binformation_schema\b/i,
  /\bxp_cmdshell\b/i,
  /\bdrop\s+table\b/i,
  /['"]\s*;\s*(select|insert|update|delete|drop)\b/i,
];

const XSS: RegExp[] = [
  /<script\b/i,
  /javascript:\s*\w/i,
  /\bon(error|load|click|mouseover)\s*=/i,
  /<iframe\b/i,
  /document\.cookie/i,
];

const TRAVERSAL: RegExp[] = [
  /\.\.[/\\]/,
  /%2e%2e[/\\%]/i,
  /\/etc\/passwd/i,
  /\/proc\/self\//i,
  /c:[\\/]windows[\\/]/i,
  /\bfile:\/\//i,
];

/**
 * Decode once so percent-encoded payloads match, but never throw — malformed
 * sequences like "%zz" make decodeURIComponent raise, and an attacker sending
 * one must not take down the middleware.
 *
 * The "+" replacement is not cosmetic. NextRequest.nextUrl re-serialises the
 * query through URLSearchParams, which encodes spaces as "+" rather than %20 —
 * so a real "?q=1 UNION SELECT" arrives here as "q=1+UNION+SELECT". Without
 * this, every space-separated injection signature silently misses in
 * production while still passing any test that feeds it raw spaces.
 */
function safeDecode(value: string): string {
  const plusesAsSpaces = value.replace(/\+/g, " ");
  try {
    return decodeURIComponent(plusesAsSpaces);
  } catch {
    return plusesAsSpaces;
  }
}

function anyMatch(patterns: RegExp[], haystack: string): string | null {
  for (const pattern of patterns) {
    const hit = haystack.match(pattern);
    if (hit) return hit[0].slice(0, 120);
  }
  return null;
}

export interface RequestFacts {
  method: string;
  path: string;
  query: string;
  userAgent: string;
}

/**
 * Returns every signature the request trips. Empty array means "nothing
 * interesting" — the common case, and the one that must stay cheap.
 */
export function detectThreats(facts: RequestFacts): Detection[] {
  const found: Detection[] = [];

  const path = facts.path;
  // Payloads hide in both the raw and decoded forms; check the concatenation.
  const surface = `${path}?${facts.query}`;
  const decoded = safeDecode(surface);
  const both = `${surface}\n${decoded}`;

  const scannerPath = anyMatch(SCANNER_PATHS, path);
  if (scannerPath) {
    found.push({
      kind: "scanner_path",
      severity: "medium",
      detail: { matched: scannerPath },
    });
  }

  const scannerUa = anyMatch(SCANNER_UA, facts.userAgent);
  if (scannerUa) {
    found.push({
      kind: "scanner_ua",
      severity: "high",
      detail: { matched: scannerUa, userAgent: facts.userAgent.slice(0, 200) },
    });
  }

  const sqli = anyMatch(SQLI, both);
  if (sqli) {
    found.push({ kind: "sqli_attempt", severity: "high", detail: { matched: sqli } });
  }

  const xss = anyMatch(XSS, both);
  if (xss) {
    found.push({ kind: "xss_attempt", severity: "high", detail: { matched: xss } });
  }

  const traversal = anyMatch(TRAVERSAL, both);
  if (traversal) {
    found.push({
      kind: "traversal_attempt",
      severity: "high",
      detail: { matched: traversal },
    });
  }

  return found;
}

/** Admin surface is always recorded, successful or not. */
export function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin");
}

const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

export function highestSeverity(detections: Detection[]): Severity {
  return detections.reduce<Severity>(
    (worst, d) => (SEVERITY_RANK[d.severity] > SEVERITY_RANK[worst] ? d.severity : worst),
    "low"
  );
}
