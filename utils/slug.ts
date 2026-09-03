/**
 * Derive a URL slug from a specimen name.
 *
 * Public specimen pages are addressed by slug (`/gallery/:slug`), so this is
 * the function that decides every catalogue URL.
 *
 * Known limits, unchanged from the inline version this replaces:
 *  - no transliteration, so accented characters are dropped rather than folded
 *    ("Ficus Café" becomes "ficus-caf")
 *  - no uniqueness guarantee; two specimens with the same name collide
 *  - the edit form does not regenerate the slug, so renaming a specimen keeps
 *    its original URL
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
