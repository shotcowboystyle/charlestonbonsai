# TODO

Engineering follow-ups not in scope of the originating ticket but worth tracking.

## Open

_None._

## Done

### Lock down `trees.price` at the data layer

Closed via combined fix:

- **Admin reads** moved to JWT-protected Nitro endpoints (`server/api/admin/listings/index.get.ts`, `server/api/admin/listings/[id].get.ts`) using the service key. `pages/admin/index.vue`, `pages/admin/listings/index.vue`, and `pages/admin/listings/[id].vue` now call those endpoints instead of querying Supabase from the browser.
- **Public catalog** moved server-side (`server/api/trees/list.get.ts`) with filter/sort/pagination support; `price` is stripped in the response transform alongside the existing `/api/trees/featured` and `/api/trees/[id]` endpoints. `pages/gallery/index.vue` and the related-trees block in `pages/gallery/[id].vue` now use it.
- **Dead direct-Supabase readers** (`composables/useTrees.ts`, `stores/trees.ts`) were deleted — they had no live callers and would have re-introduced the leak if rewired.
- **Database column revoke** at `supabase/manual-sql/revoke-price-from-anon.sql` (apply once in the Supabase SQL editor). `schema.sql:110` updated to match so a fresh apply produces the same state. After the SQL runs, `curl "$SUPABASE_URL/rest/v1/trees?select=*" -H "apikey: $ANON_KEY"` returns rows with no `price` key.
