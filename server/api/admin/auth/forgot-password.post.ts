import { createClient } from '@supabase/supabase-js'
import { generateResetToken, hashToken } from '~/server/utils/tokens'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  // Create Supabase client with service key for admin operations
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  try {
    // Check if user exists (but don't reveal this to the client)
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    // Always return success to prevent email enumeration
    if (userError || !user) {
      return {
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      }
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const tokenHash = hashToken(resetToken)

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Invalidate any existing tokens for this user
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false)

    // Store new token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })

    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      // Still return success to prevent information leakage
      return {
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      }
    }

    // Send email
    const siteUrl = config.public.siteUrl || 'http://localhost:3000'
    const { sendPasswordResetEmail } = await import('~/server/utils/email')
    await sendPasswordResetEmail(user.email, resetToken, siteUrl)

    return {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    }
  }
  catch (error) {
    console.error('Forgot password error:', error)
    // Return generic success to prevent information leakage
    return {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    }
  }
})
