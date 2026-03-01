/**
 * Send password reset email
 * Uses Resend API (configure RESEND_API_KEY in environment)
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  siteUrl: string,
): Promise<{ success: boolean, error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || 'noreply@charlestonbonsai.com'

  const resetUrl = `${siteUrl}/admin/reset-password?token=${resetToken}`

  // If no Resend API key, log the reset URL for development
  if (!resendApiKey) {
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log('PASSWORD RESET (Development Mode)')
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log(`Email: ${email}`)
    // eslint-disable-next-line no-console
    console.log(`Reset URL: ${resetUrl}`)
    // eslint-disable-next-line no-console
    console.log('===========================================')
    return { success: true }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email,
        subject: 'Reset Your Charleston Bonsai Admin Password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #2d5a27; color: white; text-decoration: none; border-radius: 6px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Reset Your Password</h2>
              <p>You requested to reset your admin password for Charleston Bonsai Gallery.</p>
              <p>Click the button below to set a new password:</p>
              <p><a href="${resetUrl}" class="button">Reset Password</a></p>
              <p>Or copy this link to your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p>This link will expire in <strong>1 hour</strong>.</p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
              <div class="footer">
                <p>Charleston Bonsai Gallery</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send email:', error)
      return { success: false, error: 'Failed to send email' }
    }

    return { success: true }
  }
  catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
