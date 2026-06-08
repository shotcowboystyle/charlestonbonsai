export function useSite() {
  const config = useRuntimeConfig()
  const siteName = config.public.siteName
  const siteDomain = config.public.siteDomain
  return {
    siteName,
    siteDomain,
    contactEmail: `hello@${siteDomain}`,
    noreplyEmail: `noreply@${siteDomain}`,
    contactMailto: `mailto:hello@${siteDomain}`,
  }
}
