// Formatting helpers: PKR currency, dates, guest counts.
export function pkr(n: number): string {
  const v = Math.round(n);
  if (!isFinite(v)) return 'Rs. 0';
  return 'Rs. ' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateShort(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sun..6=Sat
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isPast(iso: string): boolean {
  return iso < todayISO();
}

export function unitLabel(unit: string): string {
  switch (unit) {
    case 'per_guest': return 'per guest';
    case 'per_serving': return 'per serving';
    case 'per_bottle': return 'per bottle';
    case 'per_item': return 'per item';
    case 'flat': return 'per event';
    default: return unit;
  }
}
