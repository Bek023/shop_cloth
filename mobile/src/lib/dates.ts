// Uzbek date formatting without Intl, which is not complete on every Hermes build.
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

/** "2026-11-05" or ISO timestamp -> "5-noy 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d}-${MONTHS[m - 1]} ${y}`;
}

/** ISO timestamp -> "5-noy 2026, 14:05" in local time */
export function formatDateTime(iso: string): string {
  const dt = new Date(iso);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${dt.getDate()}-${MONTHS[dt.getMonth()]} ${dt.getFullYear()}, ${hh}:${mm}`;
}
