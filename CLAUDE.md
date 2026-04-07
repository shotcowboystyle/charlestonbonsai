# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build (SSR)
npm run generate     # Static site generation (used by Netlify)
npm run preview      # Preview production build locally
npm run lint         # ESLint with auto-fix
npm run typecheck    # TypeScript type checking
```

No test runner is configured. `test.mjs` is a manual Supabase connectivity verification script, not a test suite.

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
Supabase responses return snake_case; API endpoints manually convert to camelCase before sending to the client. The `trees` store handles pagination and client-side filtering (size, care level, type, price range, search, sort, inStockOnly).

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
