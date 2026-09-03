/**
 * Retreat inquiry endpoint.
 *
 * Strategy: belt-and-suspenders. Every submission is:
 *   1. Validated against the form's contract.
 *   2. Persisted to retreat_inquiries (authoritative record).
 *   3. Emailed to the studio (notification convenience).
 *
 * If the email send fails, the inquiry is still saved and the client
 * still receives `{ ok: true }` — the studio can recover the inquiry
 * from the database. If the database write fails, the request fails
 * loudly so the visitor sees the error and can retry or write directly.
 *
 * Field-level error shape matches the client's expectation
 * (`{ ok: false, field: 'email', error: 'invalid' }`) so the
 * form can target the right input. Mirrors /api/events/inquire.
 */
import { sendRetreatInquiryEmail } from '~/server/utils/email'
import { createServiceClient } from '~/server/utils/supabase'
import { asPartySize, asString, isValidEmail } from '~/server/utils/validators'

const ALLOWED_PACKAGE_TYPES = new Set([
  'weekend',
  'immersion',
  'private',
  'undecided',
])

const ALLOWED_SKILL_LEVELS = new Set([
  'beginner',
  'intermediate',
  'advanced',
])

interface InquiryBody {
  name?: unknown
  email?: unknown
  preferredDates?: unknown
  partySize?: unknown
  packageType?: unknown
  skillLevel?: unknown
  notes?: unknown
}

type FieldKey
  = | 'name'
    | 'email'
    | 'preferredDates'
    | 'partySize'
    | 'packageType'
    | 'skillLevel'
    | 'notes'

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

  const preferredDates = asString(body.preferredDates, 120)
  if (!preferredDates) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'preferredDates' as FieldKey }
  }

  const partySize = asPartySize(body.partySize)
  if (partySize === null) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'partySize' as FieldKey }
  }

  const packageType = typeof body.packageType === 'string' ? body.packageType : ''
  if (!ALLOWED_PACKAGE_TYPES.has(packageType)) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'packageType' as FieldKey }
  }

  const skillLevel = typeof body.skillLevel === 'string' ? body.skillLevel : ''
  if (!ALLOWED_SKILL_LEVELS.has(skillLevel)) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'skillLevel' as FieldKey }
  }

  // Notes can be longer; cap at 5000 chars to keep payloads sane.
  const notes = asString(body.notes, 5000)
  if (!notes) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'invalid', field: 'notes' as FieldKey }
  }

  // ---- Persist -----------------------------------------------------
  const supabase = createServiceClient()

  const { error: writeError } = await supabase
    .from('retreat_inquiries')
    .insert({
      name,
      email,
      preferred_dates: preferredDates,
      party_size: partySize,
      package_type: packageType,
      skill_level: skillLevel,
      notes,
    })

  if (writeError) {
    console.error('[retreats/inquire] persist failed:', writeError)
    setResponseStatus(event, 500)
    return { ok: false, error: 'server_error' as const }
  }

  // ---- Notify (best-effort) ---------------------------------------
  // The DB write above is the authoritative record. Email failure must
  // not lose the inquiry, so we log loudly but still return ok.
  const notify = await sendRetreatInquiryEmail({
    name,
    email,
    preferredDates,
    partySize,
    packageType,
    skillLevel,
    notes,
  })

  if (!notify.success)
    console.error('[retreats/inquire] email notification failed; inquiry was saved')

  return { ok: true }
})
