# TODO

Engineering follow-ups not in scope of the originating ticket but worth tracking.

## Open

### Lock down `trees.price` at the data layer

**Context.** As of the "remove tree prices from consumer surfaces" change, no consumer UI displays a per-tree price, and the public Nitro endpoints (`/api/trees/featured`, `/api/trees/[id]`) strip the `price` field from their responses. However, the admin dashboard (`pages/admin/listings/*`, `pages/admin/index.vue`) and the catalog page (`pages/gallery/index.vue`) read the `trees` table directly through the Supabase JS client using the **anon key**. RLS currently grants anon `SELECT` on the full row, so anyone with the public anon key — which ships in client bundles — can query the `trees` table and read the `price` column. The "by inquiry" posture in the UI is therefore not enforced at the data layer.

**Mitigations to evaluate (pick one).**

1. **Column-level RLS policy.** Revoke `SELECT (price)` from the anon role and grant it only to the authenticated/service role. The cleanest fix, but requires verifying every admin path uses an authenticated session (today the admin uses a custom JWT, not Supabase Auth, so admin Supabase queries may still run as anon — that needs auditing before this change is made).
2. **Route admin reads through service-key Nitro endpoints.** Move the price-reading admin queries into `server/api/admin/listings/*` endpoints that use `SUPABASE_SERVICE_KEY`, then revoke anon `SELECT` on the price column. More work, but fits the existing admin-API pattern.
3. **Move the catalog list endpoint server-side.** `pages/gallery/index.vue` currently queries Supabase from the client. A `/api/trees/list` Nitro endpoint that strips `price` would close the leak on the catalog page specifically. This pairs naturally with options (1) or (2).

**Verification when implemented.** With DevTools open, load `/`, `/gallery`, and `/gallery/[slug]` as an unauthenticated visitor — no network response should contain a `price` key. A raw Supabase REST call (`curl "$SUPABASE_URL/rest/v1/trees?select=*" -H "apikey: $ANON_KEY"`) should return rows without `price`.

**Why this is worth doing.** Pricing is "variable range, by conversation" — that's the brand position. Letting the dollar amount be discoverable in the network tab undercuts the posture and risks anchoring an inquiry to a stale catalog number.
