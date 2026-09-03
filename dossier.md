# Repository Dossier — charlestonbonsai

Snapshot of `shotcowboystyle/charlestonbonsai` at `dcf6dfc` (2026-08-29), generated 2026-09-03.
Every claim below was read out of the tree, not inferred from the README.

---

## 1. What this is

A single-tenant marketing + catalog site for a Charleston, SC bonsai studio. Nuxt 3
full-stack app: prerenderable public pages, a Nitro API server, and a JWT-gated admin
dashboard for managing listings. Supabase Postgres is the datastore. There is no
checkout — the business model is **price on inquiry**, and the code enforces that at
three layers (see §6).

Not a product, not a library, not multi-tenant. One studio, one admin table, one
deployment.

| Fact | Value |
|---|---|
| Commits | 50, first 2026-02-28, latest 2026-08-29 |
| Human authors | Curtis Blanton (30 commits across two identities) |
| Bot authors | renovate[bot] (18 commits — 36% of history) |
| Source LOC | ~18,600 across `pages/ components/ server/ composables/ stores/ types/ plugins/ layouts/ assets/` |
| Largest files | `pages/retreats.vue` (1366), `pages/events.vue` (1305), `pages/index.vue` (1184) |
| Tests | none |
| CI | none (`.github/` does not exist) |

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Nuxt 3.21 (Vue 3.5) | SSR build + `nuxt generate` SSG path both configured |
| Server | Nitro (`server/api/**`) | 24 endpoints |
| DB | Supabase Postgres | RLS on every table; service key server-side, anon key public-read |
| Auth | Custom JWT (`jsonwebtoken`) + `bcryptjs` | **Not** Supabase Auth. 7-day tokens, non-httpOnly cookie |
| State | Pinia | `stores/auth.ts`, `stores/toast.ts` |
| Styling | TailwindCSS 3.4 + OKLCH CSS custom properties | Two palettes coexist mid-migration (§7) |
| Motion | GSAP 3.15 (`ScrollTrigger`, `ScrollToPlugin`) | |
| 3D | Three.js 0.185 (`GLTFLoader`, `OrbitControls`) | Optional per-listing GLB models |
| Rich text | TipTap 3 | Admin listing description editor |
| Blob storage | `@vercel/blob` | Image uploads |
| Email | Resend HTTP API (no SDK) | Falls back to console logging when `RESEND_API_KEY` unset |
| QR | `qrcode` | Printable per-listing QR codes in admin |
| Lint | `@antfu/eslint-config` 9 | single quotes, 2-space, no semis |

---

## 3. Layout

```
pages/          20 routes — public marketing + gallery, /admin/* dashboard
components/     27 — ui/ (design system), gallery/, layout/, home/, admin/
server/api/     24 endpoints — trees/ subscribe/ events/ retreats/ admin/
server/utils/   requireAdmin.ts, tokens.ts, email.ts (494 lines, all templates inline)
composables/    useFilters, useSeo, useSite, useSupabase, useTheme
stores/         auth.ts, toast.ts
types/          tree.ts (domain + label maps + type guards), database.ts (hand-written Supabase Row/Insert/Update)
supabase/       manual-sql/{schema,seed,revoke-price-from-anon}.sql — applied by hand, no migration tool
assets/css/     tokens.css (282 lines of OKLCH design tokens), main.css
docs/           3D_ASSETS.md (photogrammetry pipeline), design-system.html
.agents/ .claude/ .cursor/   vendored "impeccable" design skill (~60 files) + design-system skill
```

`.agent/`, `.agents/`, `.claude/`, `.cursor/` are all agent tooling, excluded from ESLint.
`.impeccable.md` is the canonical design brief and is worth reading before touching UI —
it is unusually specific (banned typefaces, banned aesthetics, OKLCH accent hue locked at ~145).

---

## 4. Routes

**Public pages:** `/`, `/gallery`, `/gallery/[id]`, `/events`, `/retreats`, `/visit`,
`/subscribe/confirmed`, `/subscribe/unsubscribed`, `/privacy-policy`, `/terms-of-service`,
`/data-removal`

**Admin pages:** `/admin`, `/admin/login`, `/admin/listings`, `/admin/listings/create`,
`/admin/listings/[id]`, `/admin/users`, `/admin/users/create`, `/admin/forgot-password`,
`/admin/reset-password`

**Public API**

| Endpoint | Purpose |
|---|---|
| `GET /api/trees/list` | Paginated catalog. Server-side filter/sort/search, `price` stripped |
| `GET /api/trees/featured` | Up to 5 `featured` trees, `price` stripped |
| `GET /api/trees/[id]` | Single specimen, `price` stripped |
| `POST /api/subscribe` | Newsletter double-opt-in, enumeration-safe (`{ok:true}` regardless) |
| `GET /api/subscribe/confirm` | Confirmation link (sha256 token, 24h TTL) |
| `GET /api/subscribe/unsubscribe` | Opaque unauthenticated opt-out token |
| `POST /api/events/inquire` | Event rental inquiry → `event_inquiries` + email |
| `POST /api/retreats/inquire` | Retreat inquiry → `retreat_inquiries` + email |

**Admin API** (`requireAdmin` = `Authorization: Bearer <jwt>`)

| Endpoint | Guard |
|---|---|
| `GET/POST/PUT/DELETE /api/admin/listings*` (5 routes) | `requireAdmin` ✅ |
| `GET/POST/DELETE /api/admin/users*` (3 routes) | `requireAdmin` ✅ |
| `POST /api/admin/upload` | **none** ❌ — see §5.1 |
| `/api/admin/auth/*` (7 routes) | inherently public or hand-rolled inline token check |

---

## 5. Findings

### 5.1 `POST /api/admin/upload` is unauthenticated — HIGH

`server/api/admin/upload.post.ts` is 33 lines and contains no `requireAdmin`, no header
check, no token parse. It reads multipart form data and pipes it straight to
`put(file.filename, file.data, { access: 'public', token: BLOB_READ_WRITE_TOKEN })`.

Anyone on the internet can POST arbitrary files of arbitrary size and type to your Vercel
Blob store, at your expense, served from your domain's blob host. There is no MIME
allowlist, no size cap, and no filename sanitization — `put` with a caller-controlled
`filename` also means callers pick the pathname.

Fix is one line (`requireAdmin(event)` as the first statement), plus a content-type
allowlist and a size ceiling. This is the single most actionable item in the repo.

### 5.2 `JWT_SECRET` has a working default — HIGH if unset in prod

`nuxt.config.ts:18` → `jwtSecret: process.env.JWT_SECRET || 'change-me-in-production'`.
If that env var is ever missing on a deploy, the app does not fail — it signs and verifies
admin tokens with a string that is public in this repository. Anyone can then forge a valid
admin JWT and drive every `requireAdmin` endpoint. Same shape applies to
`supabaseUrl`/`supabaseAnonKey` at `nuxt.config.ts:22-23`, which default to the studio's
real live project.

The anon key itself is designed to be public and the `price` column is revoked from `anon`
(§6), so the Supabase defaults are defensible. The JWT secret default is not. Make it throw
at boot instead.

### 5.3 Committed default admin credentials

`supabase/manual-sql/schema.sql:64-67` seeds `curt.blanton@gmail.com` with the bcrypt hash
of `admin123`, and the same hash is the literal value of `ADMIN_PASSWORD_HASH` in
`.env.example:14`. If schema.sql was applied to production and the password was never
rotated, admin is `admin123`. Verify this directly; do not assume.

### 5.4 Admin route protection is client-side only

There is no `middleware/` directory. Every admin page carries only
`definePageMeta({ layout: 'admin' })`, and the guard lives in `layouts/admin.vue:35` — an
`onMounted` hook that calls `authStore.checkAuth()` and `router.push('/admin/login')` on
failure. The admin *data* is safe because every listings/users endpoint is server-guarded,
but the admin shell renders before the redirect fires. A `defineNuxtRouteMiddleware` guard
is the correct fix.

Also: `stores/auth.ts:35` sets the token cookie with `httpOnly: false` — required by the
current design (the client reads it to build the `Authorization` header), but it means any
XSS is a full admin session takeover.

### 5.5 The Netlify deployment path cannot work

`netlify.toml` sets `command = "npm run generate"` and a catch-all
`from = "/*" → to = "/index.html"` at status 200. `nuxt generate` produces a fully
prerendered app with **no Nitro server**, so none of `/api/*` exists. That takes out the
newsletter, both inquiry forms, and the entire admin dashboard. Netlify is documented in
`README.md` as a first-class option; the real target is Vercel (`vercel.json`,
`@vercel/blob`, `nitro.prerender.ignore: ['/api']`). Either delete the Netlify path or
switch it to `npm run build` with the Netlify Nuxt preset.

### 5.6 No CI, no tests, and Renovate merging into both

There is no `.github/` directory — no workflows, no PR template, no Dependabot config.
`renovate.json` extends `local>shotcowboystyle/renovate-config`, and 18 of 50 commits are
dependency bumps. Nothing runs `npm run lint`, `npm run typecheck`, or a build against
those bumps before they land on `main`. `test.mjs` is a hardcoded Supabase connectivity
script, not a test.

A single GitHub Actions workflow running `lint` + `typecheck` + `build` would eliminate the
largest source of undetected breakage in this repo's actual commit pattern.

### 5.7 Two lockfiles, three package managers implied

`bun.lock` (368 KB) and `pnpm-lock.yaml` (437 KB) are both committed, `pnpm-workspace.yaml`
exists with pnpm-specific `trustPolicy`/`onlyBuiltDependencies` settings, and every document
(`README.md`, `DEPLOYMENT.md`, `CLAUDE.md`, `.claude/launch.json`) says `npm`. There is no
`packageManager` field in `package.json`. Whichever manager a given deploy or contributor
picks resolves a different tree. Pick one, delete the other lockfile, and pin it with
`packageManager`.

### 5.8 `CLAUDE.md` is stale in five specific ways

It is the file every agent reads first, and it currently misdescribes the repo:

1. Points at `supabase/schema.sql`; the file is at `supabase/manual-sql/schema.sql`.
2. Lists `stores/trees.ts` and `composables/useTrees` as live. Both were **deleted** in the
   price-lockdown work (documented in `TODO.md`) precisely because they re-introduced the
   price leak. An agent trusting CLAUDE.md would recreate them.
3. The public API surface omits six endpoints: `/api/trees/list`, `/api/subscribe`,
   `/api/subscribe/confirm`, `/api/subscribe/unsubscribe`, `/api/events/inquire`,
   `/api/retreats/inquire`.
4. Says `/api/trees/featured` returns "featured **in-stock**" trees. The `in_stock` filter
   was removed in commit `#2`; it now returns any featured tree.
5. Says filtering is client-side in a Pinia store. It is server-side in
   `server/api/trees/list.get.ts`.

### 5.9 Six environment variables are undocumented

Code reads 13 env vars. `.env.example` documents 7. Missing: `SITE_NAME`, `SITE_DOMAIN`,
`BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, `STUDIO_EMAIL`. Without
`RESEND_API_KEY` the inquiry endpoints silently degrade to `console.log` — the row is still
persisted, but nobody is notified. Without `BLOB_READ_WRITE_TOKEN` image upload fails at
runtime with a 500.

Related: `server/utils/email.ts` reads `process.env` directly throughout, contradicting
CLAUDE.md's stated convention of going through `useRuntimeConfig()`. It works, but it is the
one file that opts out.

### 5.10 A dead RLS policy

`supabase/manual-sql/schema.sql:78-85` defines `"Admin can manage trees"` gated on
`auth.jwt() ->> 'email'`. The app does not use Supabase Auth — it issues its own JWTs — so
`auth.jwt()` is always null for this application and the policy never grants anything.
Writes work because they go through the service key, which bypasses RLS entirely. The policy
is inert and misleading; it should be dropped or replaced with a comment explaining that
writes are service-key-only.

---

## 6. What is genuinely well built

Not everything here needs fixing. Three things are above the line for a project this size:

**Price suppression is defense-in-depth, done correctly.** `TODO.md` documents the full
closure. `types/tree.ts` defines `PublicTree = Omit<Tree, 'price'>` as the consumer-facing
type. All three public tree endpoints construct that shape field-by-field rather than
spreading, so a new DB column cannot leak by accident. And
`supabase/manual-sql/revoke-price-from-anon.sql` revokes the column from the `anon` role at
the database, so a raw REST call with the public key returns rows with no `price` key at
all. The dead readers that would have re-introduced the leak were deleted, not left in
place. This is the correct pattern and the reasoning is written down.

**The subscriber flow is enumeration-safe.** `POST /api/subscribe` returns `{ok:true}` for
every valid email regardless of whether the address is new, pending, confirmed, or
previously unsubscribed. Confirmation tokens are stored as sha256 hashes with a 24h TTL and
the raw token is never persisted. Unsubscribe uses a separate opaque token so any email link
can opt out without auth.

**The inquiry endpoints have an explicit failure contract.** Both `events/inquire` and
`retreats/inquire` persist first and email second, and the header comment states why: a
failed email must not lose an inquiry, a failed DB write must fail loudly so the visitor can
retry. Field-level error shapes match what the forms expect. That reasoning being in the
file is the difference between a convention and an accident.

The design token system (`assets/css/tokens.css`) is likewise not decoration — OKLCH
throughout, `light-dark()` with a `[data-theme]` override, and a pre-paint inline script in
`nuxt.config.ts` that sets `data-theme` before first paint to kill the flash.

---

## 7. The in-flight design migration

`tailwind.config.ts` carries a header comment stating the config is in transition and that
**two systems coexist**:

- **Legacy:** `cream / sage / forest / bark / moss / stone / charcoal` palette, Playfair +
  Outfit fonts, `soft`/`warm`/`dramatic` shadows.
- **Current (sumi-e):** semantic `surface / text / border / ink-N / paper-N / accent` reading
  from `tokens.css`, Cardo + Albert Sans, `ink-line`/`press`/`lift` shadows, semantic 4pt
  spacing.

The stated rule is **never mix the two namespaces inside one component** — a component is
either migrated or it isn't. Migrated so far: homepage, site chrome, gallery + specimen
detail, legal pages, events, retreats. Not migrated: the entire `/admin` surface
(`layouts/admin.vue` still uses `bg-cream-100`, `bg-forest`, `border-stone-200`).

Anyone doing UI work must read `.impeccable.md` first. It bans specific typefaces (Playfair,
Inter, DM Sans, Space Grotesk, and 11 more), bans pure `#000`/`#fff`, caps accent usage at
10% of visual weight, and requires `prefers-reduced-motion` to be a complete path rather
than a degraded one. It also commits to WCAG AAA (7:1) for body text — an unusually strong
target that no automated check currently verifies.

---

## 8. Data model

Five tables, all with RLS enabled, all writes via service key.

| Table | Shape | Access |
|---|---|---|
| `trees` | 20 columns, `tree_type`/`care_level`/`size` CHECK-constrained to the TS unions, `updated_at` trigger, 6 indexes | `anon` has column-scoped SELECT **excluding `price`**; `authenticated` has full SELECT |
| `admin_users` | email + bcrypt hash + `last_password_change` | RLS `USING (false)` — private |
| `password_reset_tokens` | sha256 hash, `expires_at`, `used` flag, FK cascade | private |
| `subscribers` | double-opt-in state machine: `pending → confirmed → unsubscribed`, hashed confirmation token + opaque unsubscribe token | private |
| `event_inquiries` / `retreat_inquiries` | immutable one-row-per-submission records, CHECK-constrained enums, `party_size` capped 1–6 | private |

`types/database.ts` is **hand-written**, not generated — its header even carries the
`supabase gen types` command that would generate it. It currently covers only `trees` and
`admin_users`; `subscribers`, `event_inquiries`, and `retreat_inquiries` are absent, so
those endpoints are typed against `any` from the Supabase client. There is no migration
system: schema changes are pasted into the Supabase SQL editor by hand, which means the
committed schema and the live database can silently diverge with nothing to detect it.

---

## 9. Recommended order of work

Ranked by consequence per unit of effort, not by ease.

1. **Add `requireAdmin(event)` to `server/api/admin/upload.post.ts`**, plus a MIME allowlist
   and a size cap. One line for the guard. It is an open write endpoint on a paid store
   right now.
2. **Make `JWT_SECRET` fail closed.** Throw at boot when unset rather than falling back to a
   published string.
3. **Verify the production admin password is not `admin123`,** then remove the seeded
   credentials from `schema.sql` and `.env.example`.
4. **Add one GitHub Actions workflow** running `lint` + `typecheck` + `build` on PRs. With
   36% of commits coming from Renovate and zero tests, this is the highest-leverage
   structural change available.
5. **Pick one package manager.** Delete the other lockfile, add `packageManager` to
   `package.json`, make the docs agree.
6. **Move the admin guard to route middleware** rather than `onMounted`.
7. **Update `CLAUDE.md`** against §5.8 and document the six missing env vars in
   `.env.example`. Stale agent instructions actively cause regressions here — the deleted
   `stores/trees.ts` is a live example of something an agent would helpfully recreate.
8. **Resolve the Netlify path** — delete it or fix it to `npm run build`.
9. **Regenerate `types/database.ts`** from the live schema so the three untyped tables are
   covered.
10. **Finish the admin surface's sumi-e migration,** or explicitly declare admin exempt and
    say so in `tailwind.config.ts`.

Items 1–3 are security. 4–5 are the difference between a repo that resists regression and
one that doesn't. The rest is debt with a known shape.
