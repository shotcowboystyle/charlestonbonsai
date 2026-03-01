import { createClient } from '@supabase/supabase-js'
import { hashPassword, hashToken, isTokenExpired } from '~/server/utils/tokens'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { token, password, confirmPassword } = body

  // Validate inputs
  if (!token || !password || !confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token, password, and password confirmation are required',
    })
  }

  if (password !== confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Passwords do not match',
    })
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters',
    })
  }

  // Create Supabase client with service key
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  try {
    // Hash the token to find it in the database
    const tokenHash = hashToken(token)

    // Find the token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*, admin_users(*)')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .single()

    if (tokenError || !resetToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset token',
      })
    }

    // Check if token is expired
    if (isTokenExpired(resetToken.expires_at)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reset token has expired',
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user's password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        last_password_change: new Date().toISOString(),
      })
      .eq('id', resetToken.user_id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update password',
      })
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    // Invalidate all other tokens for this user
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', resetToken.user_id)

    return {
      success: true,
      message: 'Password has been reset successfully',
    }
  }
  catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    console.error('Reset password error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred',
    })
  }
})
