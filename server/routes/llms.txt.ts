import { createAnonClient } from '~/server/utils/supabase'
import { SITE_ADDRESS, SITE_PAGES, SITE_SUMMARY } from '~/utils/site'

// https://llmstxt.org — a markdown map of the site for language models.
export default defineEventHandler(async (event) => {
  const { siteUrl, siteName, siteDomain } = useRuntimeConfig().public

  // Explicit columns: price must never reach a public surface.
  const { data, error } = await createAnonClient()
    .from('trees')
    .select('name, slug, species, short_description')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    // Better to ship the page map than fail the whole file.
    console.error('Error fetching trees for llms.txt:', error)
  }

  const { streetAddress, addressLocality, addressRegion, postalCode } = SITE_ADDRESS
  const lines = [
    `# ${siteName}`,
    '',
    `> ${SITE_SUMMARY}`,
    '',
    'Trees are sold by inquiry; prices are not published. Every specimen is trained by hand at the nursery.',
    '',
    '## Pages',
    '',
    ...SITE_PAGES.map(page => `- [${page.title}](${siteUrl}${page.path}): ${page.description}`),
    '',
    '## Catalog (in stock)',
    '',
    ...(data ?? []).map(tree =>
      `- [${tree.name}](${siteUrl}/gallery/${encodeURIComponent(tree.slug)}): ${[tree.species, tree.short_description].filter(Boolean).join(' — ')}`),
    '',
    '## Contact',
    '',
    `- Email: hello@${siteDomain}`,
    `- Nursery: ${streetAddress}, ${addressLocality}, ${addressRegion} ${postalCode} (by appointment, Tuesday through Saturday)`,
    '',
  ]

  setHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  return lines.join('\n')
})
