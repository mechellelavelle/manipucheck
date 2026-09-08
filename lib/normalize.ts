/**
 * Models occasionally return a string-array field as one string containing
 * pseudo-XML (<item>…</item>), sometimes with a following section's content and
 * stray closing tags bled into it. Observed in production against a valid
 * schema, so the routes repair it rather than trusting the shape.
 */

const SECTION_TAGS = /<\/?(notes|omitted|report_draft|report_analysis|caveats|reasons)>/gi;

function fromMarkup(raw: string, section?: string): string[] {
  let s = raw;

  // If a later section bled in, keep only this one's part.
  if (section) {
    const open = new RegExp(`<${section}>`, "i");
    const close = new RegExp(`</${section}>`, "i");
    const o = s.search(open);
    if (o !== -1) s = s.slice(o + s.match(open)![0].length);
    const c = s.search(close);
    if (c !== -1) s = s.slice(0, c);
  } else {
    // Trailing sections after the first closing tag are not ours.
    const firstClose = s.search(/<\/(notes|omitted|caveats|reasons)>/i);
    if (firstClose !== -1) s = s.slice(0, firstClose);
  }

  const items = [...s.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1].trim());
  if (items.length) return items.filter(Boolean);

  return s
    .replace(SECTION_TAGS, "")
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

/** Coerce a field that should be string[] into string[], repairing markup leakage. */
export function toStringArray(value: unknown, section?: string): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.replace(SECTION_TAGS, "").trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return fromMarkup(value, section);
  return [];
}

/** Strip stray section tags from a field that should be a plain string. */
export function toPlainString(value: unknown): string {
  return typeof value === "string" ? value.replace(SECTION_TAGS, "").trim() : "";
}
