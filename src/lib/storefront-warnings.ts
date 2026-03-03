const WARNING_MAPPINGS: Array<{ test: RegExp; message: string }> = [
  {
    test: /zero enabled payment methods/i,
    message:
      "Some payment methods are temporarily unavailable while checkout options sync.",
  },
  {
    test: /groups\/categories are empty/i,
    message:
      "Category data is still syncing. Products are live and can still be purchased.",
  },
  {
    test: /could not fetch groups/i,
    message: "Some category labels may be incomplete while we refresh group data.",
  },
  {
    test: /could not fetch categories/i,
    message:
      "Some category labels may be incomplete while we refresh category data.",
  },
  {
    test: /could not fetch payment methods/i,
    message:
      "Checkout providers are refreshing. If checkout fails, try again in a moment.",
  },
  {
    test: /rate-limited/i,
    message:
      "Live data is temporarily rate-limited. Showing the latest available storefront snapshot.",
  },
  {
    test: /api failed|temporarily failed|request failed/i,
    message:
      "Live data is temporarily unavailable. You may see fallback catalog data until sync recovers.",
  },
];

function normalizeWarning(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  const mapped = WARNING_MAPPINGS.find((rule) => rule.test.test(value));
  return mapped ? mapped.message : value;
}

export function formatStorefrontWarnings(warnings: string[] = []): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const warning of warnings) {
    const friendly = normalizeWarning(warning);
    if (!friendly || seen.has(friendly)) continue;
    seen.add(friendly);
    output.push(friendly);
  }

  return output;
}
