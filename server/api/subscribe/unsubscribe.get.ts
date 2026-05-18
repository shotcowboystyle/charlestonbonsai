/**
 * Unsubscribe via the per-subscriber token in every confirmation email.
 *
 * Token is opaque and unauthenticated; visiting the link always 302s to
 * the unsubscribed page. We treat an unknown token as a soft success to
 * avoid leaking which addresses are on the list.
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'http://localhost:3000'
  const { token } = getQuery(event)

  if (typeof token !== 'string' || token.length < 32)
    return sendRedirect(event, `${siteUrl}/subscribe/unsubscribed`, 302)

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  const { error } = await supabase
    .from('subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      confirmation_token_hash: null,
      confirmation_expires_at: null,
    })
    .eq('unsubscribe_token', token)

  if (error)
    console.error('[subscribe/unsubscribe] update failed:', error)

  return sendRedirect(event, `${siteUrl}/subscribe/unsubscribed`, 302)
})
