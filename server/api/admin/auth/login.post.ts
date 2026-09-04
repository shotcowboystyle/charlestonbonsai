import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  // Create Supabase client with service key for admin operations.
  // Security Note: createServiceClient() has been updated to strictly require
  // the SUPABASE_SERVICE_KEY and will no longer dangerously fall back to the
  // anon key, preventing privilege escalation vulnerabilities.
  const supabase = createServiceClient()

  try {
    // Fetch admin user
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      })
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      config.jwtSecret,
      { expiresIn: '7d' },
    )

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    }
  }
  catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
