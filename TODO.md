# TODO

Engineering follow-ups not in scope of the originating ticket but worth tracking.

## Open

Surfaced while building the test suite (see the Done entry below). Each was
deliberately left out of that change: the tests characterise current behaviour
rather than fixing it, so changing any of these will fail a test on purpose —
that is the signal to update the test alongside the fix.

Roughly highest-risk first.

### Rotate the Supabase credentials committed to the repo

`nuxt.config.ts:22-23` hardcodes the live `supabaseUrl` and `supabaseAnonKey` as
`runtimeConfig.public` defaults, so they ship in the client bundle and are in git
history. The now-deleted `test.mjs` carried the same pair.

The anon key is public by design and is only as dangerous as the RLS policy
behind it, so this is not an emergency — but it cannot be rotated without a code
change, which is the actual problem. Move both to `NUXT_PUBLIC_*` environment
variables with no in-repo default, then rotate.

Confirm the service key was never committed before closing this.

### `admin_token` cookie is readable by JavaScript

`stores/auth.ts:33-37` sets `httpOnly: false`, so any XSS on an admin page can
exfiltrate a 7-day admin JWT. It is set client-side, which is *why* it cannot be
httpOnly — fixing it means having `/api/admin/auth/login` set the cookie in its
response and having `requireAdmin` read the cookie as well as the bearer header.

Related: `server/api/admin/auth/logout.post.ts` is a no-op that returns success
without invalidating anything, so a leaked token stays valid for its full 7 days.
A token blacklist or short-lived tokens plus refresh would close both.

### Email lookups disagree on case

- `server/api/admin/auth/login.post.ts:26` looks up the raw `email`
- `server/api/admin/auth/forgot-password.post.ts:25` lowercases it
- `server/api/admin/users/create.post.ts:30` stores and checks the raw value

So an admin created as `Admin@example.com` can sign in, but password reset
silently no-ops (it returns the same generic message either way by design, so
the failure is invisible). Duplicate-detection on create is also case-sensitive,
which allows two accounts differing only in case.

Fix: normalise to lowercase on write and on every lookup. Needs a one-off
`UPDATE admin_users SET email = lower(email)` plus a unique index on
`lower(email)`.

### Password reset invalidates historical tokens, not just live ones

`server/api/admin/auth/reset-password.post.ts:88-91` runs
`.update({ used: true }).eq('user_id', ...)` with no `.eq('used', false)` filter,
so it rewrites every row that user has ever had. Harmless today — already-used
rows are being set to the value they already hold — but it makes the table's
history useless for auditing and the write grows without bound.

### `/api/admin/users/create` does not validate the email format

`server/api/admin/users/create.post.ts:12` checks only that `email` is truthy and
that the password is at least 8 characters. `isValidEmail` now exists in
`server/utils/validators.ts`; wire it in. An admin account with an unusable
address cannot receive a password reset.

### Two handlers re-implement `requireAdmin`

`server/api/admin/auth/verify.get.ts:19` and
`server/api/admin/auth/change-password.post.ts:54` each inline their own
`jwt.verify` instead of calling `requireAdmin`. Three copies of the same auth
check means a future hardening pass can miss one. Collapse them onto the shared
helper — `test/server/require-admin.test.ts` already covers its behaviour.

### Netlify and Vercel configs contradict each other

`vercel.json` declares the Nuxt framework preset; `netlify.toml` runs
`npm run generate` and redirects `/*` to `/index.html`. The Netlify path would
produce a static SPA whose catch-all redirect swallows every `/api/**` route,
breaking admin auth and all inquiry forms.

Vercel is the real target (`DEPLOYMENT.md` is Vercel-only, and uploads depend on
`@vercel/blob`). Delete `netlify.toml` unless Netlify is genuinely a fallback.
Both files also invoke `npm` while the repo is pnpm-locked.

Also delete the stale committed `bun.lock` — `pnpm-lock.yaml` is the live one,
and two lockfiles invite a wrong-resolver install.

### Node version is unpinned

No `engines` field, no `.nvmrc`, no `.node-version`. CI runs Node 24
(`.github/workflows/ci.yml`) while local development has been on Node 26, so
"works on my machine" divergence is unguarded. Pin one and make CI match.

### Held-back dependency upgrades

- `vitest` is capped at `^4` by a `packageRules` entry in `renovate.json`,
  because `@nuxt/test-utils@4.2.0` peer-requires it. Release the cap when
  test-utils supports Vitest 5.
- `pinia` is on `^3.0.4` to satisfy `@pinia/nuxt@0.11.3`'s peer range. Pinia 4
  is out; upgrading needs `@pinia/nuxt` to move first. The 2.x mismatch is what
  caused the 404-renders-as-500 bug, so keep the peer range satisfied.

### Known-lenient validation, pinned by tests

Each is asserted as current behaviour, with a comment saying so:

- `EMAIL_PATTERN` accepts a leading dot in the domain (`dot@.example.com`) —
  `server/utils/validators.ts`
- `isValidDateString` accepts `2026-02-30`, which `Date` rolls over to March 1 —
  same file
- `isTokenExpired` returns `false` for an unparseable date, i.e. it fails **open**:
  a corrupt `expires_at` would let a reset token through — `server/utils/tokens.ts`

The first two are cosmetic. The third is the one worth fixing.

### Slug generation has no transliteration or uniqueness guard

`utils/slug.ts` drops accented and non-Latin characters rather than folding them
("Ficus Café" → `ficus-caf`, "真柏" → empty), and nothing prevents two specimens
from colliding. The create endpoint now returns 409 on a duplicate slug
(`server/api/admin/listings/create.post.ts`), so a collision is at least visible
rather than a 500 — but the admin has to resolve it by renaming.

The edit form also does not regenerate the slug, so renaming a specimen keeps
its original URL. That is deliberate (URLs stay stable) and is documented in the
module, but it means the slug can drift far from the name.

### Test-coverage gaps

- `components/ui/RichTextEditor.vue` (301 lines, TipTap) has no tests — it needs
  a full ProseMirror DOM and was judged poor value for the cost.
- Playwright runs Chromium only. No Firefox/WebKit, no mobile viewport, and no
  visual regression.
- E2E covers the public catalogue and admin login. The authenticated admin CRUD
  flows are covered at the handler level only.
- `composables/useFilters.ts` and `composables/useSupabase.ts` have no importers
  anywhere in `pages/`, `components/`, `stores/`, `layouts/` or `plugins/`.
  Confirm and delete rather than test them.

### `.nuxtrc` carries a version-pinned marker

`@nuxt/test-utils` writes a `setups.@nuxt/test-utils="4.2.0"` line into `.nuxtrc`
on install. It is committed so a fresh clone matches, but the pinned version
means every test-utils bump produces a diff in this file. If that turns into
Renovate noise, gitignore it instead — nothing reads it at runtime.

## Done

### Stand up a test framework and CI gate

Four layers, all run by `pnpm run verify` (`lint:ci` + `typecheck` + `test` +
`build`) and by `.github/workflows/ci.yml` on every push and PR:

- **Unit** (`test/unit/`) — node env, no mocks.
- **API handlers** (`test/server/`) — real h3 helpers stubbed in as the Nitro
  auto-imports, plus a fake chainable Supabase client.
- **Components** (`test/nuxt/`) — `environment: 'nuxt'` with happy-dom.
- **End-to-end** (`test/e2e/`) — Playwright against `build` + `preview`, with
  Supabase pointed at a dead port so the suite is hermetic.

Convention: `*.test.ts` is Vitest, `*.spec.ts` is Playwright. Tests live in a
top-level `test/` directory and must not be colocated — Nitro scans
`server/api/**/*.ts` as routes, so `server/api/trees/list.test.ts` would ship as
the live endpoint `/api/trees/list.test`.

Supporting refactors, all behaviour-preserving: `server/utils/supabase.ts` (the
single injection seam, replacing 21 inline `createClient` calls),
`server/utils/mappers.ts` (5 duplicated snake_case mappers; `mapPublicTreeRow`
is now the runtime enforcement of the price-omission invariant),
`server/utils/tree-query.ts`, `server/utils/validators.ts` (3 copies of
`EMAIL_PATTERN`), `utils/pricing.ts`, `utils/slug.ts`, and
`utils/tree-filters.ts` (3 copies of `toggleIn`).

Bugs found and fixed in the process:

- **HTML 404s returned HTTP 500.** `@pinia/nuxt@0.11.3` peer-requires
  `pinia@^3.0.4` but the repo pinned 2.3.1; Pinia 2's `shouldHydrate` called
  `obj.hasOwnProperty` on a null-prototype object while serialising the error
  page payload. A soft-404 that was poisoning search indexing.
- **`/api/admin/upload` had no auth guard** — the only route under `/api/admin`
  that anyone on the internet could call, writing to public Blob storage. Added
  `requireAdmin`, an extension allowlist, and a size cap.
- **Listing create/update wrote raw `readBody()`** to Supabase. Now validated
  and allowlisted by `server/utils/tree-payload.ts`, so `id`/`created_at`/
  `updated_at` and unknown columns can no longer be set. Duplicate slug now
  409s and a missing listing 404s, both previously 500.
- **`components/ui/Modal.vue` leaked its body scroll lock** when unmounted while
  open, leaving the page unscrollable.

### Lock down `trees.price` at the data layer

Closed via combined fix:

- **Admin reads** moved to JWT-protected Nitro endpoints (`server/api/admin/listings/index.get.ts`, `server/api/admin/listings/[id].get.ts`) using the service key. `pages/admin/index.vue`, `pages/admin/listings/index.vue`, and `pages/admin/listings/[id].vue` now call those endpoints instead of querying Supabase from the browser.
- **Public catalog** moved server-side (`server/api/trees/list.get.ts`) with filter/sort/pagination support; `price` is stripped in the response transform alongside the existing `/api/trees/featured` and `/api/trees/[id]` endpoints. `pages/gallery/index.vue` and the related-trees block in `pages/gallery/[id].vue` now use it.
- **Dead direct-Supabase readers** (`composables/useTrees.ts`, `stores/trees.ts`) were deleted — they had no live callers and would have re-introduced the leak if rewired.
- **Database column revoke** at `supabase/manual-sql/revoke-price-from-anon.sql` (apply once in the Supabase SQL editor). `schema.sql:110` updated to match so a fresh apply produces the same state. After the SQL runs, `curl "$SUPABASE_URL/rest/v1/trees?select=*" -H "apikey: $ANON_KEY"` returns rows with no `price` key.
