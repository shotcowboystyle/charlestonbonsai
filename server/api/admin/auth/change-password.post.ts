import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { hashPassword, verifyPassword } from '~/server/utils/tokens'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { currentPassword, newPassword, confirmPassword } = body

  // Validate inputs
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'All fields are required',
    })
  }

  if (newPassword !== confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New passwords do not match',
    })
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be at least 8 characters',
    })
  }

  if (currentPassword === newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be different from current password',
    })
  }

  // Get user from token
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    })
  }

  const token = authHeader.substring(7)

  let decoded: { id: string, email: string }
  try {
    decoded = jwt.verify(token, config.jwtSecret) as { id: string, email: string }
  }
  catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token',
    })
  }

  // Create Supabase client with service key
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  try {
    // Get current user
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', decoded.id)
      .single()

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found',
      })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password_hash)

    if (!isValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect',
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        last_password_change: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update password',
      })
    }

    return {
      success: true,
      message: 'Password changed successfully',
    }
  }
  catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    console.error('Change password error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred',
    })
  }
})
