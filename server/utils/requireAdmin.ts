import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'

export function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig()

  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: No token provided',
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string, email: string }
    return decoded
  }
  catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid or expired token',
    })
  }
}
