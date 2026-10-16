// Owner: agent/frontend. Small, honest formatting for links and dates (TASK-106).

/** A link's address as a person would say it: no scheme, no "www.", no mailto:, no trailing slash. */
export function displayAddress(href: string): string {
  return href
    .replace(/^mailto:/, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parse(iso: string): { year: string; month: number } | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year: match[1]!, month };
}

/**
 * "2026-10-16" -> "October 2026". Parsed by hand rather than through Date, so the month never
 * shifts with the visitor's time zone and the words never change with their locale. Malformed
 * input returns null, so the page can leave the line out rather than print "Invalid Date".
 */
export function formatUpdated(iso: string): string | null {
  const date = parse(iso);
  return date ? `${MONTHS[date.month - 1]} ${date.year}` : null;
}

export function yearOf(iso: string): string | null {
  return parse(iso)?.year ?? null;
}
