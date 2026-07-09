/**
 * Format a Date as a local YYYY-MM-DD string (no UTC shift).
 *
 * The previous code used `date.toISOString().split('T')[0]`, which first
 * converts the Date to UTC before slicing. In any timezone *behind* UTC that
 * pushes a local midnight such as 2026-07-09 02:00 into the previous day
 * (2026-07-08), corrupting expiry dates and meal-plan date ranges.
 *
 * This helper formats using the machine's LOCAL calendar components, so the
 * string stays on the same calendar day the user actually sees.
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
