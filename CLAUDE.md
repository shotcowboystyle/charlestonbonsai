# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build (SSR)
npm run generate     # Static site generation (used by Netlify)
npm run preview      # Preview production build locally
npm run lint         # ESLint with auto-fix
npm run lint:ci      # ESLint without --fix (the CI gate)
npm run typecheck    # TypeScript type checking
npm run test         # All three Vitest projects (unit + server + nuxt)
npm run test:unit    # Node-env projects only — fast inner loop
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright (builds + previews the app first)
npm run verify       # lint:ci + typecheck + test + build (the full local gate)
```

### Testing

| Layer | Location | Environment |
|-------|----------|-------------|
| Pure unit | `test/unit/` | node, no mocks |
| API handlers | `test/server/` | node + stubbed Nitro globals + fake Supabase |
| Components | `test/nuxt/` | `environment: 'nuxt'` + happy-dom |
| End-to-end | `test/e2e/` | Playwright against `build` + `preview` |

**Convention: `*.test.ts` is Vitest, `*.spec.ts` is Playwright.** The globs never overlap.

Tests live in a top-level `test/` directory, never colocated — Nitro scans `server/api/**/*.ts` as routes, so a colocated `server/api/trees/list.test.ts` would ship as the live endpoint `/api/trees/list.test`.

Handler tests stub the Nitro auto-imports in `test/setup/nitro-globals.ts` (real h3 implementations; only `defineEventHandler` and `useRuntimeConfig` are faked) and mock `~/server/utils/supabase` — that module is the single injection seam for the database. `test/utils/supabase-mock.ts` models the chainable query builder, including the `.single()` (PGRST116 on empty) vs `.maybeSingle()` (null on empty) difference.

E2E runs against a build whose Supabase URL points at a dead port, so it never touches live data; all API responses come from `page.route` fixtures.

Pin `vitest` to `^4` — `@nuxt/test-utils` does not yet support Vitest 5 (enforced by a `packageRules` entry in `renovate.json`).

## Architecture

**Nuxt 3 + Supabase bonsai gallery** — full-stack with file-based routing, Nitro API server, Pinia state, and TailwindCSS.

### Key Technology Choices
- **Database:** Supabase PostgreSQL with RLS (service key for server-side, anon key for public reads)
- **Auth:** Custom JWT + bcrypt — not Supabase Auth. JWTs are 7-day, validated via `server/utils/requireAdmin.ts`
- **Image uploads:** Vercel Blob (`/api/admin/upload`)
- **Rich text:** TipTap v3 (used in listing forms)
- **Animation:** GSAP (scroll), Three.js (3D models on gallery detail pages)

### Directory Layout

| Path | Purpose |
|------|---------|
| `pages/` | File-based routes. `admin/` is the protected dashboard |
| `server/api/` | Nitro API endpoints. `trees/` = public, `admin/` = JWT-protected |
| `server/utils/` | Shared server helpers: `requireAdmin.ts`, `email.ts`, token utils |
| `stores/` | Pinia: `trees.ts` (data + filters), `auth.ts` (admin session), `toast.ts` |
| `composables/` | Vue composables: `useTrees`, `useFilters`, `useSeo`, `useSupabase` |
| `components/ui/` | Reusable design system components |
| `types/` | Shared TypeScript: `tree.ts` (enums + interfaces), `database.ts` |
| `supabase/` | `schema.sql` (tables, RLS, triggers) + `seed.sql` |

### API Surface

**Public:**
- `GET /api/trees/featured` — 5 featured in-stock trees
- `GET /api/trees/[id]`

**Admin (JWT required):**
- `POST /api/admin/auth/login|logout|forgot-password|reset-password|change-password`
- `GET /api/admin/auth/verify|validate-reset-token`
- `POST /api/admin/listings/create`, `PUT /api/admin/listings/[id]`, `DELETE /api/admin/listings/[id]`
- `GET /api/admin/users/index`, `POST /api/admin/users/create`, `DELETE /api/admin/users/[id]`
- `POST /api/admin/upload`

### Data Flow
Supabase responses return snake_case; `server/utils/mappers.ts` converts to camelCase. `mapPublicTreeRow` omits `price` — that function is the runtime enforcement of the price-omission invariant (`PublicTree = Omit<Tree, 'price'>` compiles away), so public handlers must map through it rather than spreading rows. `mapAdminTreeRow` adds `price` back for admin surfaces.

Supabase clients come from `server/utils/supabase.ts` (`createAnonClient` for public reads, `createServiceClient` for admin/write paths) — never construct one inline, or handler tests lose their injection seam. The `trees` store handles pagination and client-side filtering (size, care level, type, price range, search, sort, inStockOnly).

## Environment Variables

Accessed through Nuxt runtime config (`useRuntimeConfig()`), not directly via `process.env`:

```
SUPABASE_URL              # Public (also in nuxt.config.ts default)
SUPABASE_ANON_KEY         # Public anon key
SUPABASE_SERVICE_KEY      # Server-only, full DB access
JWT_SECRET                # Server-only, sign admin tokens
BLOB_READ_WRITE_TOKEN     # Vercel Blob uploads
ADMIN_EMAIL               # Default admin email
ADMIN_PASSWORD_HASH       # bcrypt hash (overrides schema default)
SITE_URL                  # For email links
```

## Code Conventions

- **Style:** Single quotes, 2-space indent, no semicolons (enforced by `@antfu/eslint-config`)
- **TypeScript:** Strict mode + `noUncheckedIndexedAccess`
- **Enum display:** Use `TREE_TYPE_LABELS`, `CARE_LEVEL_LABELS` etc. from `types/tree.ts` for human-readable labels; use type guards (`isTreeType`, etc.) for runtime validation
- **Toast notifications:** Use `stores/toast.ts` — never `alert()` or `console` in components
- **No console.log in frontend** — server-side `console.error` in catch blocks is acceptable

## Database

Schema is in `supabase/schema.sql`. No migration system — schema changes are applied manually. RLS is enabled: anon/authenticated roles have SELECT on `trees`; all writes require the service key via server-side API routes.
