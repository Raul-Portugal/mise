/**
 * Formats a duration in seconds into a human-readable digital clock format.
 * - Under an hour: MM:SS (e.g. 05:30)
 * - One hour or more: H:MM:SS (e.g. 1:15:00)
 */
export function formatTime(secs: number): string {
  const safeSecs = Math.max(0, Math.floor(secs));
  const h = Math.floor(safeSecs / 3600);
  const m = Math.floor((safeSecs % 3600) / 60);
  const s = safeSecs % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
