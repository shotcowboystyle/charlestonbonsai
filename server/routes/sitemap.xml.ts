import { createAnonClient } from '~/server/utils/supabase'
import { SITE_PAGES } from '~/utils/site'

export default defineEventHandler(async (event) => {
  const { siteUrl } = useRuntimeConfig().public

  const { data, error } = await createAnonClient()
    .from('trees')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1000)

  if (error) {
    // Better to ship the static pages than fail the whole sitemap.
    console.error('Error fetching trees for sitemap:', error)
  }

  const urls = [
    ...SITE_PAGES.map(page => `<url><loc>${siteUrl}${page.path}</loc></url>`),
    ...(data ?? []).map(tree =>
      `<url><loc>${siteUrl}/gallery/${encodeURIComponent(tree.slug)}</loc><lastmod>${new Date(tree.updated_at).toISOString()}</lastmod></url>`),
  ]

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
})
