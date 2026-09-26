/**
 * Document numbering. Tokens: {YYYY} {YY} {MM} {SEQ} {SEQ:n} (n = zero-padded width).
 * Numbers are assigned when a document is issued, from an atomic counter, so the sequence
 * is chronological and has no gaps (legal requirement in France and most countries).
 */

/** The counter period implied by a pattern: a new sequence per month, per year, or never reset. */
export function counterPeriod(pattern: string, date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  if (pattern.includes('{MM}')) return `${y}-${m}`;
  if (pattern.includes('{YYYY}') || pattern.includes('{YY}')) return String(y);
  return 'all';
}

export function formatNumber(pattern: string, date: Date, seq: number): string {
  const y = String(date.getUTCFullYear());
  return pattern
    .replaceAll('{YYYY}', y)
    .replaceAll('{YY}', y.slice(2))
    .replaceAll('{MM}', String(date.getUTCMonth() + 1).padStart(2, '0'))
    .replace(/\{SEQ(?::(\d))?\}/g, (_, width: string | undefined) => String(seq).padStart(Number(width ?? 1), '0'));
}
