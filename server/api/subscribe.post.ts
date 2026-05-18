/**
 * Subscribe endpoint — STUB.
 *
 * The footer signup form posts here. This is a temporary no-op that
 * validates the shape of the request and returns success. A real
 * implementation should persist the email to a `subscribers` table
 * (Supabase, service key) with timestamp, source, and an unsubscribe
 * token, plus the standard double-opt-in flow.
 *
 * TODO: replace with real persistence + double-opt-in email.
 *
 * Request body:  { email: string }
 * Response:       { ok: true } on success, 4xx with { ok: false, error } on bad input
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown }>(event).catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid_email' as const }
  }

  // Stub: returns success without persisting. Replace with real
  // persistence (Supabase service-key insert into a `subscribers`
  // table) plus a double-opt-in email before launch.
  return { ok: true }
})
