/**
 * Event rental inquiry endpoint.
 *
 * Strategy: belt-and-suspenders. Every submission is:
 *   1. Validated against the form's contract.
 *   2. Persisted to event_inquiries (authoritative record).
 *   3. Emailed to the studio (notification convenience).
 *
 * If the email send fails, the inquiry is still saved and the client
 * still receives `{ ok: true }` — the studio can recover the inquiry
 * from the database. If the database write fails, the request fails
 * loudly so the visitor sees the error and can retry or write directly.
 *
 * Field-level error shape matches the client's expectation
 * (`{ ok: false, field: 'email', error: 'invalid_email' }`) so the
 * form can target the right input.
 */
import { sendEventInquiryEmail } from '~/server/utils/email'
import { createServiceClient } from '~/server/utils/supabase'
import { asOptionalSmallInt, asString, isValidDateString, isValidEmail } from '~/server/utils/validators'

const ALLOWED_EVENT_TYPES = new Set([
  'wedding',
  'private_dinner',
  'hospitality',
  'corporate',
  'other',
])

interface InquiryBody {
  name?: unknown
  email?: unknown
  eventDate?: unknown
  location?: unknown
  eventType?: unknown
  headcount?: unknown
  tableCount?: unknown
  notes?: unknown
}

type FieldKey = 'name' | 'email' | 'eventDate' | 'location' | 'eventType' | 'notes'

export default defineEventHandler(async (event) => {
  const body = await readBody<InquiryBody>(event).catch(() => null)
  if (!body) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid_body' as const }
  }

  // ---- Validate ----------------------------------------------------
  const name = asString(body.name, 120)
  if (!name) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'name' as FieldKey }
  }

  const rawEmail = typeof body.email === 'string' ? body.email.trim() : ''
  if (!isValidEmail(rawEmail)) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'email' as FieldKey }
  }
  const email = rawEmail.toLowerCase()

  if (!isValidDateString(body.eventDate)) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'eventDate' as FieldKey }
  }
  const eventDate = body.eventDate

  const location = asString(body.location, 255)
  if (!location) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'location' as FieldKey }
  }

  const eventType = typeof body.eventType === 'string' ? body.eventType : ''
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'eventType' as FieldKey }
  }

  const headcount = asOptionalSmallInt(body.headcount)
  const tableCount = asOptionalSmallInt(body.tableCount)

  // Notes can be longer; cap at 5000 chars to keep payloads sane.
  const notes = asString(body.notes, 5000)
  if (!notes) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'notes' as FieldKey }
  }

  // ---- Persist -----------------------------------------------------
  const supabase = createServiceClient()

  const { error: writeError } = await supabase
    .from('event_inquiries')
    .insert({
      name,
      email,
      event_date: eventDate,
      location,
      event_type: eventType,
      headcount,
      table_count: tableCount,
      notes,
    })

  if (writeError) {
    console.error('[events/inquire] persist failed:', writeError)
    setResponseStatus(event, 500)
    return { ok: false, error: 'server_error' as const }
  }

  // ---- Notify (best-effort) ---------------------------------------
  // The DB write above is the authoritative record. Email failure must
  // not lose the inquiry, so we log loudly but still return ok.
  const notify = await sendEventInquiryEmail({
    name,
    email,
    eventDate,
    location,
    eventType,
    headcount,
    tableCount,
    notes,
  })

  if (!notify.success)
    console.error('[events/inquire] email notification failed; inquiry was saved')

  return { ok: true }
})
