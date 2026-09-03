import { createServiceClient } from '~/server/utils/supabase'
import { hashToken, isTokenExpired } from '~/server/utils/tokens'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const { token } = query

  if (!token || typeof token !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required',
    })
  }

  // Create Supabase client with service key
  const supabase = createServiceClient()

  try {
    // Hash the token to find it in the database
    const tokenHash = hashToken(token)

    // Find the token
    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('id, expires_at, used')
      .eq('token_hash', tokenHash)
      .single()

    if (error || !resetToken) {
      return {
        valid: false,
        message: 'Invalid reset token',
      }
    }

    if (resetToken.used) {
      return {
        valid: false,
        message: 'This reset link has already been used',
      }
    }

    if (isTokenExpired(resetToken.expires_at)) {
      return {
        valid: false,
        message: 'This reset link has expired',
      }
    }

    return {
      valid: true,
      message: 'Token is valid',
    }
  }
  catch (error) {
    console.error('Validate token error:', error)
    return {
      valid: false,
      message: 'An error occurred',
    }
  }
})
