// Business facts and the public page list, shared by page JSON-LD (via
// useSite) and the crawler routes in server/routes (sitemap, llms.txt).

export const SITE_ADDRESS = {
  streetAddress: '943 Godber Street',
  addressLocality: 'Charleston',
  addressRegion: 'SC',
  postalCode: '29412',
  addressCountry: 'US',
} as const

export const SITE_FOUNDING_YEAR = '2015'

export const SITE_SUMMARY = 'Specimen bonsai trained by hand in Charleston, South Carolina. Over twenty years at the bench and around two hundred trees in the nursery. Visits by appointment, Tuesday through Saturday.'

export interface SitePage {
  path: string
  title: string
  description: string
}

/** Indexable pages. Admin, subscribe and data-removal are deliberately absent. */
export const SITE_PAGES: SitePage[] = [
  { path: '/', title: 'Home', description: 'The nursery, the trees and how to visit.' },
  { path: '/gallery', title: 'Catalog', description: 'Working catalog of bonsai specimens. Pricing by inquiry.' },
  { path: '/visit', title: 'Visit', description: 'Nursery visits by appointment, Tuesday through Saturday.' },
  { path: '/events', title: 'Events', description: 'Bonsai composed for weddings, private dinners and hospitality installs in the Lowcountry.' },
  { path: '/retreats', title: 'Retreats', description: 'Multi-day bonsai workshops at a private house in the Blue Ridge.' },
  { path: '/privacy-policy', title: 'Privacy Policy', description: 'How visitor and inquiry information is handled.' },
  { path: '/terms-of-service', title: 'Terms of Service', description: 'Terms governing use of the site and catalog.' },
]
