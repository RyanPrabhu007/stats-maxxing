// All date math is in the user's local timezone — day boundary = local midnight.

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = parseISO(fromISO).getTime();
  const to = parseISO(toISO).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function formatDateLong(iso: string): string {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
