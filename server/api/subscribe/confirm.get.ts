/**
 * Confirm a pending subscription via the token emailed during /api/subscribe.
 *
 * Flow: hash the supplied token, find the matching `pending` subscriber,
 * verify it hasn't expired, flip status to `confirmed`, then 302 to the
 * confirmation page. Outcomes are surfaced via `?status=` query so the
 * page can render the right copy without exposing internals.
 */
import { createClient } from '@supabase/supabase-js'
import { hashToken, isTokenExpired } from '~/server/utils/tokens'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'http://localhost:3000'
  const { token } = getQuery(event)

  if (typeof token !== 'string' || token.length < 32)
    return sendRedirect(event, `${siteUrl}/subscribe/confirmed?status=invalid`, 302)

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  const tokenHash = hashToken(token)
  const { data: subscriber, error } = await supabase
    .from('subscribers')
    .select('id, status, confirmation_expires_at')
    .eq('confirmation_token_hash', tokenHash)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[subscribe/confirm] lookup failed:', error)
    return sendRedirect(event, `${siteUrl}/subscribe/confirmed?status=invalid`, 302)
  }

  if (!subscriber)
    return sendRedirect(event, `${siteUrl}/subscribe/confirmed?status=invalid`, 302)

  if (subscriber.status === 'confirmed')
    return sendRedirect(event, `${siteUrl}/subscribe/confirmed?status=already`, 302)

  if (!subscriber.confirmation_expires_at || isTokenExpired(subscriber.confirmation_expires_at))
    return sendRedirect(event, `${siteUrl}/subscribe/confirmed?status=expired`, 302)

  const { error: updateError } = await supabase
    .from('subscribers')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmation_token_hash: null,
      confirmation_expires_at: null,
    })
    .eq('id', subscriber.id)

  if (updateError) {
    console.error('[subscribe/confirm] update failed:', updateError)
    return sendRedirect(event, `${siteUrl}/subscribe/confirmed?status=invalid`, 302)
  }

  return sendRedirect(event, `${siteUrl}/subscribe/confirmed?status=confirmed`, 302)
})
