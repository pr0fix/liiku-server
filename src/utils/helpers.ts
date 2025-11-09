export function msToKmh(ms?: number | null): number {
  if (ms == null || Number.isNaN(ms)) return 0;
  return ms * 3.6;
}

export function formatKmh(ms?: number | null): string {
  const kmh = msToKmh(ms);
  return `${kmh.toFixed(0)} km/h`;
}
