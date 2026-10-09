// GA4 loaded through Partytown: both tags are `text/partytown`, so gtag.js
// executes in a web worker. Universal (not .client) so the tags land in the
// prerendered HTML.
export default defineNuxtPlugin((nuxtApp) => {
  const id = useRuntimeConfig().public.gaMeasurementId
  if (!id)
    return

  // Unhead's script typings only allow known `type` values; spreading hides
  // the Partytown one from the checker without widening anything else.
  const partytown = { type: 'text/partytown' } as Record<never, never>

  useHead({
    script: [
      { src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, ...partytown },
      {
        ...partytown,
        innerHTML: `window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',${JSON.stringify(id)},{send_page_view:false});`,
      },
    ],
  })

  if (import.meta.server)
    return

  // GA's history-change detection runs in the worker and can't see
  // main-thread pushState, so page views are sent manually. page:finish fires
  // on first load and every client navigation. The send waits one macrotask
  // because Unhead flushes document.title in its own setTimeout(0), queued
  // when the new page registered its head; sending sooner reports the
  // previous page's title.
  const router = useRouter()
  nuxtApp.hook('page:finish', () => {
    const { path } = router.currentRoute.value
    if (path.startsWith('/admin'))
      return
    setTimeout(() => {
      window.gtag?.('event', 'page_view', {
        page_location: window.location.href,
        page_path: path,
        page_title: document.title,
      })
    }, 0)
  })
})

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}
