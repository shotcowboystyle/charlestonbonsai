import type { PublicTree } from '~/types'
import { TREE_TYPE_LABELS } from '~/types'
import { SITE_FOUNDING_YEAR, SITE_SUMMARY } from '~/utils/site'

export function useSeo(options: {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
}) {
  const { siteName, siteUrl } = useSite()
  const route = useRoute()
  const defaultTitle = `${siteName} Gallery`

  const {
    title = defaultTitle,
    description = `Discover exceptional bonsai trees cultivated with care by ${siteName}.`,
    image = '/og-image.jpg',
    url = siteUrl + route.path,
    type = 'website',
  } = options

  const fullTitle = title === defaultTitle
    ? title
    : `${title} — ${siteName}`

  // OG/Twitter scrapers need absolute image URLs.
  const imageUrl = absoluteUrl(image, siteUrl)

  useHead({
    title: fullTitle,
    meta: [
      { name: 'description', content: description },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
      { property: 'og:type', content: type },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: url },
      { property: 'og:site_name', content: siteName },
    ],
    link: [
      { rel: 'canonical', href: url },
    ],
  })
}

export function useJsonLd(data: object | object[]) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(Array.isArray(data) ? data : [data]),
      },
    ],
  })
}

function absoluteUrl(src: string, siteUrl: string) {
  return src.startsWith('/') ? siteUrl + src : src
}

/** Stable @id other schemas reference as provider/brand/publisher. */
export function businessId(siteUrl: string) {
  return `${siteUrl}/#business`
}

export function buildProductSchema(tree: PublicTree, siteUrl: string) {
  const url = `${siteUrl}/gallery/${tree.slug}`
  const images = (tree.thumbnail && !tree.images.includes(tree.thumbnail)
    ? [tree.thumbnail, ...tree.images]
    : tree.images).map(src => absoluteUrl(src, siteUrl))

  // Offers/price are intentionally omitted — pricing is by inquiry. A
  // Product without an Offer is valid schema.org and the correct signal
  // when price is not published.
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': tree.name,
    'description': tree.description,
    'image': images,
    'url': url,
    'sku': tree.slug,
    'category': TREE_TYPE_LABELS[tree.treeType],
    'brand': { '@id': businessId(siteUrl) },
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${siteUrl}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Catalog', 'item': `${siteUrl}/gallery` },
      { '@type': 'ListItem', 'position': 3, 'name': tree.name, 'item': url },
    ],
  }

  return [product, breadcrumbs] as const
}

export function useProductSeo(tree: PublicTree) {
  const { siteName, siteUrl } = useSite()

  useSeo({
    title: tree.name,
    description: tree.shortDescription || `${tree.name} — a specimen from the ${siteName} catalog.`,
    image: tree.thumbnail || tree.images[0],
    url: `${siteUrl}/gallery/${tree.slug}`,
    type: 'product',
  })
  useJsonLd(buildProductSchema(tree, siteUrl))
}

export function useBusinessSchema() {
  const { siteName, siteUrl, address, contactEmail } = useSite()

  useJsonLd([
    {
      '@context': 'https://schema.org',
      '@type': 'GardenStore',
      '@id': businessId(siteUrl),
      'name': siteName,
      'url': `${siteUrl}/`,
      'logo': `${siteUrl}/icon-512.png`,
      'image': `${siteUrl}/og-image.jpg`,
      'email': contactEmail,
      'description': SITE_SUMMARY,
      'foundingDate': SITE_FOUNDING_YEAR,
      'address': { '@type': 'PostalAddress', ...address },
      'areaServed': 'Charleston, South Carolina',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteName,
      'url': `${siteUrl}/`,
      'publisher': { '@id': businessId(siteUrl) },
    },
  ])
}

export function useServiceSchema(service: { name: string, description: string, areaServed: string }) {
  const { siteUrl } = useSite()
  const route = useRoute()

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': service.name,
    'description': service.description,
    'url': siteUrl + route.path,
    'areaServed': service.areaServed,
    'provider': { '@id': businessId(siteUrl) },
  })
}
