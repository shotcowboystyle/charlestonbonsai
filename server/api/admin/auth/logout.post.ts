export default defineEventHandler(async (event) => {
  // In a more robust implementation, you might want to:
  // - Blacklist the token
  // - Clear server-side session data
  
  return {
    success: true,
    message: 'Logged out successfully',
  }
})
