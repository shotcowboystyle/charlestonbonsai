/**
 * Shared request-validation primitives for the Nitro handlers.
 *
 * These were duplicated verbatim across the inquiry and subscribe endpoints;
 * keeping one copy means a fix to the email pattern lands everywhere at once.
 */

/**
 * Deliberately permissive: it rejects obvious typos and empty local/domain
 * parts without trying to be RFC 5322. Real verification is the confirmation
 * email, not the regex.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

/** Longest address the RFC allows; also the subscribers column width. */
export const MAX_EMAIL_LENGTH = 254

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= MAX_EMAIL_LENGTH
    && EMAIL_PATTERN.test(value)
}

/**
 * Trim a required free-text field, rejecting empty and over-long values.
 * Returns null when the value is unusable, so callers can report the field.
 */
export function asString(value: unknown, max: number): string | null {
  if (typeof value !== 'string')
    return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > max)
    return null
  return trimmed
}

/**
 * An optional whole number within a sane range. Empty, null and undefined all
 * mean "not supplied" and yield null — as does anything unparseable.
 */
export function asBoundedInt(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '')
    return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n))
    return null
  if (n < min || n > max)
    return null
  return n
}

/** Headcounts and table counts: smallint-backed, realistically capped lower. */
export function asOptionalSmallInt(value: unknown): number | null {
  return asBoundedInt(value, 1, 5000)
}

/** Retreat party size. */
export function asPartySize(value: unknown): number | null {
  return asBoundedInt(value, 1, 6)
}

/**
 * A calendar date in the `YYYY-MM-DD` form `<input type="date">` emits.
 *
 * The pattern check comes first so that inputs like `2026-02-30` are rejected
 * by Date parsing rather than silently rolling over to March.
 */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string')
    return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime())
}
