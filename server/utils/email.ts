// Brand identity is configurable via env so the same code can ship under a
// different name and domain. Email prefixes (hello/noreply) are derived from
// SITE_DOMAIN; EMAIL_FROM and STUDIO_EMAIL still override when set.
const siteName = () => process.env.SITE_NAME || 'Charleston Bonsai'
const siteDomain = () => process.env.SITE_DOMAIN || 'charlestonbonsai.com'

/**
 * Inquiry payload from the /events landing page.
 * Mirrors the shape persisted to event_inquiries.
 */
export interface EventInquiryPayload {
  name: string
  email: string
  eventDate: string
  location: string
  eventType: string
  headcount: number | null
  tableCount: number | null
  notes: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  private_dinner: 'Private dinner',
  hospitality: 'Hospitality install',
  corporate: 'Corporate event',
  other: 'Something else',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Send a notification to the studio when an event inquiry is submitted.
 * Falls back to a console log in development when RESEND_API_KEY is unset.
 * Best-effort: failure here must not lose the inquiry, which has already
 * been persisted to event_inquiries by the calling endpoint.
 */
export async function sendEventInquiryEmail(
  payload: EventInquiryPayload,
): Promise<{ success: boolean, error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || `noreply@${siteDomain()}`
  const studioEmail = process.env.STUDIO_EMAIL
    || process.env.ADMIN_EMAIL
    || `hello@${siteDomain()}`

  const eventTypeLabel = EVENT_TYPE_LABELS[payload.eventType] || payload.eventType
  const subject = `New event inquiry — ${eventTypeLabel}, ${payload.eventDate}`

  if (!resendApiKey) {
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log('EVENT INQUIRY (Development Mode)')
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log(`To:            ${studioEmail}`)
    // eslint-disable-next-line no-console
    console.log(`Subject:       ${subject}`)
    // eslint-disable-next-line no-console
    console.log(`Name:          ${payload.name}`)
    // eslint-disable-next-line no-console
    console.log(`Email:         ${payload.email}`)
    // eslint-disable-next-line no-console
    console.log(`Event date:    ${payload.eventDate}`)
    // eslint-disable-next-line no-console
    console.log(`Location:      ${payload.location}`)
    // eslint-disable-next-line no-console
    console.log(`Event type:    ${eventTypeLabel}`)
    // eslint-disable-next-line no-console
    console.log(`Headcount:     ${payload.headcount ?? '—'}`)
    // eslint-disable-next-line no-console
    console.log(`Tables:        ${payload.tableCount ?? '—'}`)
    // eslint-disable-next-line no-console
    console.log('Notes:')
    // eslint-disable-next-line no-console
    console.log(payload.notes)
    // eslint-disable-next-line no-console
    console.log('===========================================')
    return { success: true }
  }

  const rows: Array<[string, string]> = [
    ['Name', payload.name],
    ['Email', payload.email],
    ['Event date', payload.eventDate],
    ['Location', payload.location],
    ['Event type', eventTypeLabel],
    ['Approx. headcount', payload.headcount === null ? '—' : String(payload.headcount)],
    ['Approx. tables', payload.tableCount === null ? '—' : String(payload.tableCount)],
  ]

  const detailRows = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding: 6px 16px 6px 0; color: #666; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
        <td style="padding: 6px 0; color: #222; font-size: 15px; vertical-align: top;">${escapeHtml(value)}</td>
      </tr>`)
    .join('')

  const notesHtml = escapeHtml(payload.notes).replace(/\n/g, '<br>')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: studioEmail,
        reply_to: payload.email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #222; background: #f7f5f0;">
            <div style="max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #fdfcf8;">
              <p style="font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #888; margin: 0 0 8px;">${escapeHtml(siteName())} · Event inquiry</p>
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 400; font-size: 28px; line-height: 1.2; color: #222; margin: 0 0 24px;">
                ${escapeHtml(eventTypeLabel)} — ${escapeHtml(payload.eventDate)}
              </h1>
              <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; margin: 0 0 24px;">
                ${detailRows}
              </table>
              <p style="font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #888; margin: 0 0 8px;">Notes</p>
              <div style="font-size: 15px; line-height: 1.6; color: #222; white-space: normal;">
                ${notesHtml}
              </div>
              <p style="margin: 32px 0 0; font-size: 13px; color: #888;">
                Reply directly to this email to respond to ${escapeHtml(payload.name)}.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send event inquiry email:', error)
      return { success: false, error: 'Failed to send email' }
    }

    return { success: true }
  }
  catch (error) {
    console.error('Error sending event inquiry email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Inquiry payload from the /retreats landing page.
 * Mirrors the shape persisted to retreat_inquiries.
 */
export interface RetreatInquiryPayload {
  name: string
  email: string
  preferredDates: string
  partySize: number
  packageType: string
  skillLevel: string
  notes: string
}

const PACKAGE_LABELS: Record<string, string> = {
  weekend: 'A weekend at the bench',
  immersion: 'The five-day immersion',
  private: 'Private commission',
  undecided: 'Not sure yet',
}

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

/**
 * Send a notification to the studio when a retreat inquiry is submitted.
 * Falls back to a console log in development when RESEND_API_KEY is unset.
 * Best-effort: failure here must not lose the inquiry, which has already
 * been persisted to retreat_inquiries by the calling endpoint.
 */
export async function sendRetreatInquiryEmail(
  payload: RetreatInquiryPayload,
): Promise<{ success: boolean, error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || `noreply@${siteDomain()}`
  const studioEmail = process.env.STUDIO_EMAIL
    || process.env.ADMIN_EMAIL
    || `hello@${siteDomain()}`

  const packageLabel = PACKAGE_LABELS[payload.packageType] || payload.packageType
  const skillLabel = SKILL_LABELS[payload.skillLevel] || payload.skillLevel
  const subject = `New retreat inquiry — ${packageLabel}, ${payload.preferredDates}`

  if (!resendApiKey) {
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log('RETREAT INQUIRY (Development Mode)')
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log(`To:              ${studioEmail}`)
    // eslint-disable-next-line no-console
    console.log(`Subject:         ${subject}`)
    // eslint-disable-next-line no-console
    console.log(`Name:            ${payload.name}`)
    // eslint-disable-next-line no-console
    console.log(`Email:           ${payload.email}`)
    // eslint-disable-next-line no-console
    console.log(`Preferred dates: ${payload.preferredDates}`)
    // eslint-disable-next-line no-console
    console.log(`Party size:      ${payload.partySize}`)
    // eslint-disable-next-line no-console
    console.log(`Package:         ${packageLabel}`)
    // eslint-disable-next-line no-console
    console.log(`Skill level:     ${skillLabel}`)
    // eslint-disable-next-line no-console
    console.log('Notes:')
    // eslint-disable-next-line no-console
    console.log(payload.notes)
    // eslint-disable-next-line no-console
    console.log('===========================================')
    return { success: true }
  }

  const rows: Array<[string, string]> = [
    ['Name', payload.name],
    ['Email', payload.email],
    ['Preferred dates', payload.preferredDates],
    ['Party size', String(payload.partySize)],
    ['Package', packageLabel],
    ['Skill level', skillLabel],
  ]

  const detailRows = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding: 6px 16px 6px 0; color: #666; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
        <td style="padding: 6px 0; color: #222; font-size: 15px; vertical-align: top;">${escapeHtml(value)}</td>
      </tr>`)
    .join('')

  const notesHtml = escapeHtml(payload.notes).replace(/\n/g, '<br>')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: studioEmail,
        reply_to: payload.email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #222; background: #f7f5f0;">
            <div style="max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #fdfcf8;">
              <p style="font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #888; margin: 0 0 8px;">${escapeHtml(siteName())} · Retreat inquiry</p>
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 400; font-size: 28px; line-height: 1.2; color: #222; margin: 0 0 24px;">
                ${escapeHtml(packageLabel)} — ${escapeHtml(payload.preferredDates)}
              </h1>
              <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; margin: 0 0 24px;">
                ${detailRows}
              </table>
              <p style="font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #888; margin: 0 0 8px;">Notes</p>
              <div style="font-size: 15px; line-height: 1.6; color: #222; white-space: normal;">
                ${notesHtml}
              </div>
              <p style="margin: 32px 0 0; font-size: 13px; color: #888;">
                Reply directly to this email to respond to ${escapeHtml(payload.name)}.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send retreat inquiry email:', error)
      return { success: false, error: 'Failed to send email' }
    }

    return { success: true }
  }
  catch (error) {
    console.error('Error sending retreat inquiry email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

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
  const emailFrom = process.env.EMAIL_FROM || `noreply@${siteDomain()}`

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
        subject: `Reset Your ${siteName()} Admin Password`,
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
              <p>You requested to reset your admin password for ${escapeHtml(siteName())} Gallery.</p>
              <p>Click the button below to set a new password:</p>
              <p><a href="${resetUrl}" class="button">Reset Password</a></p>
              <p>Or copy this link to your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p>This link will expire in <strong>1 hour</strong>.</p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
              <div class="footer">
                <p>${escapeHtml(siteName())} Gallery</p>
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

/**
 * Send the double-opt-in confirmation email to a new subscriber.
 * Falls back to a console log in development when RESEND_API_KEY is unset.
 */
export async function sendSubscribeConfirmationEmail(
  email: string,
  confirmationToken: string,
  unsubscribeToken: string,
  siteUrl: string,
): Promise<{ success: boolean, error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || `noreply@${siteDomain()}`

  const confirmUrl = `${siteUrl}/api/subscribe/confirm?token=${confirmationToken}`
  const unsubscribeUrl = `${siteUrl}/api/subscribe/unsubscribe?token=${unsubscribeToken}`

  if (!resendApiKey) {
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log('SUBSCRIBE CONFIRMATION (Development Mode)')
    // eslint-disable-next-line no-console
    console.log('===========================================')
    // eslint-disable-next-line no-console
    console.log(`Email: ${email}`)
    // eslint-disable-next-line no-console
    console.log(`Confirm:     ${confirmUrl}`)
    // eslint-disable-next-line no-console
    console.log(`Unsubscribe: ${unsubscribeUrl}`)
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
        subject: `Confirm your ${siteName()} subscription`,
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
              <h2>One more step</h2>
              <p>Please confirm you'd like to hear from ${escapeHtml(siteName())} when a new tree is listed.</p>
              <p><a href="${confirmUrl}" class="button">Confirm subscription</a></p>
              <p>Or copy this link to your browser:</p>
              <p style="word-break: break-all; color: #666;">${confirmUrl}</p>
              <p>This link will expire in <strong>24 hours</strong>. If you didn't request this, you can safely ignore this email.</p>
              <div class="footer">
                <p>${escapeHtml(siteName())} Gallery</p>
                <p>Not interested? <a href="${unsubscribeUrl}">Unsubscribe</a>.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send confirmation email:', error)
      return { success: false, error: 'Failed to send email' }
    }

    return { success: true }
  }
  catch (error) {
    console.error('Error sending confirmation email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
