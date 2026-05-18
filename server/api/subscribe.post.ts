/**
 * Subscribe endpoint — double-opt-in.
 *
 * 1. Validates email shape.
 * 2. Upserts a `subscribers` row (lowercased email is the unique key).
 *    - New address: insert as `pending` with a fresh confirmation token.
 *    - Existing `pending`: reissue the token + email (idempotent re-submit).
 *    - Existing `confirmed`: silent no-op (don't reveal subscription state).
 *    - Existing `unsubscribed`: re-arm as `pending` with a fresh token.
 * 3. Sends the confirmation email out-of-band.
 *
 * Always returns `{ ok: true }` on valid input — never reveals whether
 * an email is already known.
 */
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { sendSubscribeConfirmationEmail } from '~/server/utils/email'
import { hashToken } from '~/server/utils/tokens'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown }>(event).catch(() => null)
  const rawEmail = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!rawEmail || !EMAIL_PATTERN.test(rawEmail) || rawEmail.length > 254) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid_email' as const }
  }

  const email = rawEmail.toLowerCase()
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  const { data: existing, error: lookupError } = await supabase
    .from('subscribers')
    .select('id, status, unsubscribe_token')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    console.error('[subscribe] lookup failed:', lookupError)
    setResponseStatus(event, 500)
    return { ok: false, error: 'server_error' as const }
  }

  // Already confirmed: silently succeed without re-sending email.
  if (existing?.status === 'confirmed')
    return { ok: true }

  const confirmationToken = generateToken()
  const confirmationTokenHash = hashToken(confirmationToken)
  const confirmationExpiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS).toISOString()

  let unsubscribeToken: string
  let writeError: { message?: string } | null = null

  if (existing) {
    unsubscribeToken = existing.unsubscribe_token
    const { error } = await supabase
      .from('subscribers')
      .update({
        status: 'pending',
        confirmation_token_hash: confirmationTokenHash,
        confirmation_expires_at: confirmationExpiresAt,
        unsubscribed_at: null,
      })
      .eq('id', existing.id)
    writeError = error
  }
  else {
    unsubscribeToken = generateToken()
    const { error } = await supabase
      .from('subscribers')
      .insert({
        email,
        status: 'pending',
        confirmation_token_hash: confirmationTokenHash,
        confirmation_expires_at: confirmationExpiresAt,
        unsubscribe_token: unsubscribeToken,
        source: 'footer',
      })
    writeError = error
  }

  if (writeError) {
    console.error('[subscribe] persist failed:', writeError)
    setResponseStatus(event, 500)
    return { ok: false, error: 'server_error' as const }
  }

  const siteUrl = config.public.siteUrl || 'http://localhost:3000'
  await sendSubscribeConfirmationEmail(email, confirmationToken, unsubscribeToken, siteUrl)

  return { ok: true }
})
