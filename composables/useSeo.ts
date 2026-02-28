export function useSeo(options: {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
}) {
  const config = useRuntimeConfig()
  const route = useRoute()

  const {
    title = 'Charleston Bonsai Gallery',
    description = 'Discover exceptional bonsai trees cultivated with care in Charleston.',
    image = '/images/og-image.jpg',
    url = config.public.siteUrl + route.path,
    type = 'website',
  } = options

  const fullTitle = title === 'Charleston Bonsai Gallery'
    ? title
    : `${title} | Charleston Bonsai`

  useHead({
    title: fullTitle,
    meta: [
      { name: 'description', content: description },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { property: 'og:type', content: type },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:site_name', content: 'Charleston Bonsai' },
    ],
    link: [
      { rel: 'canonical', href: url },
    ],
  })
}

export function useProductSeo(tree: {
  name: string
  description: string
  price: number
  images: string[]
  slug: string
}) {
  const config = useRuntimeConfig()

  useSeo({
    title: tree.name,
    description: tree.description.slice(0, 160),
    image: tree.images[0],
    url: `${config.public.siteUrl}/gallery/${tree.slug}`,
    type: 'product',
  })

  // Product-specific structured data
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          'name': tree.name,
          'description': tree.description,
          'image': tree.images,
          'offers': {
            '@type': 'Offer',
            'price': tree.price,
            'priceCurrency': 'USD',
            'availability': 'https://schema.org/InStock',
          },
        }),
      },
    ],
  })
}
