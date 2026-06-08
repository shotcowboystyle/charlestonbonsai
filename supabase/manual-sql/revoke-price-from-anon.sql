-- Revoke anon SELECT on trees.price.
--
-- Context: anon SELECT was granted on the whole `trees` table, so anyone
-- with the public anon key (shipped in client bundles) could read the
-- price column via a raw PostgREST call — undercutting the "price by
-- inquiry" posture even after price was removed from consumer UIs.
--
-- This migration revokes the table-wide SELECT and re-grants it column
-- by column, omitting `price`. Server-side endpoints that need price
-- (server/api/admin/listings/*) use the service key, which bypasses
-- these grants.
--
-- Run once in the Supabase SQL editor. `schema.sql` has been updated to
-- match so a fresh apply produces the same end state.

REVOKE SELECT ON trees FROM anon;

GRANT SELECT (
  id, name, slug, species, tree_type, description, short_description,
  care_level, size, age, height, pot_type, images, thumbnail,
  model_3d_url, features, in_stock, featured, created_at, updated_at
) ON trees TO anon;

-- Verify: this should return rows without a `price` key.
--   curl "$SUPABASE_URL/rest/v1/trees?select=*" -H "apikey: $ANON_KEY"
-- And this should return an error / 401:
--   curl "$SUPABASE_URL/rest/v1/trees?select=price" -H "apikey: $ANON_KEY"
