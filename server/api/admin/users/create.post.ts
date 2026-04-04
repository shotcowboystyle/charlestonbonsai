import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  // 1. Verify admin (only admins can create admins)
  requireAdmin(event)

  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { email, password } = body

  if (!email || !password || password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid email and a password of at least 8 characters are required',
    })
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(10)
  const password_hash = await bcrypt.hash(password, salt)

  // 3. Create service client to bypass RLS
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  // 4. Check if user already exists
  const { data: existingUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this email already exists',
    })
  }

  // 5. Insert new user
  const { data: newUser, error } = await supabase
    .from('admin_users')
    .insert({
      email,
      password_hash,
    })
    .select('id, email, created_at')
    .single()

  if (error) {
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user',
    })
  }

  return { success: true, user: newUser }
})
