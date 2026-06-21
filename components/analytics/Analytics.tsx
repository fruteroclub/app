import Script from 'next/script'

/**
 * Vercel Analytics mount (T7).
 *
 * The `@vercel/analytics` React package is not installed in this workspace (T1
 * omitted it; later-wave agents must not `add` deps). This component instead
 * loads Vercel Analytics via its first-party endpoint script — the documented
 * package-free integration. On Vercel, `/_vercel/insights/script.js` is served
 * automatically and, once loaded, exposes `window.va`, which `lib/analytics.track`
 * dispatches custom events through. Off Vercel the script 404s harmlessly and
 * `track()` falls back to its dev console trace (no silent failure).
 *
 * Mounted once at the document root (root layout) so pageviews + custom events
 * are captured across both the marketing and authed groups.
 *
 * FOLLOW-UP: swap to `<Analytics />` from `@vercel/analytics/react` once the
 * package is installed — it adds dev-mode debug + route-change pageviews via the
 * App Router hooks. This script tag is the package-free equivalent for now.
 */
export function Analytics() {
  return (
    <Script
      src="/_vercel/insights/script.js"
      strategy="afterInteractive"
      data-disable-auto-pageviews="false"
    />
  )
}
