import { SITE_ADDRESS } from '~/utils/site'

export function useSite() {
  const config = useRuntimeConfig()
  const siteName = config.public.siteName
  const siteDomain = config.public.siteDomain
  return {
    siteName,
    siteDomain,
    siteUrl: config.public.siteUrl,
    address: SITE_ADDRESS,
    contactEmail: `hello@${siteDomain}`,
    noreplyEmail: `noreply@${siteDomain}`,
    contactMailto: `mailto:hello@${siteDomain}`,
  }
}
