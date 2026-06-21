/**
 * Analytics events (T7).
 *
 * Typed wrapper over Vercel Analytics custom events. The plan's stack names
 * "Vercel Analytics" but the `@vercel/analytics` npm package is NOT installed in
 * this workspace (T1 omitted it) — and later-wave agents must not run `add`. So
 * this module integrates against the Vercel Analytics *injected runtime global*
 * (`window.va`), which is the documented script-tag path and needs no package.
 *
 * No silent failure (Hard rule #6): when the runtime global is absent (analytics
 * not yet wired, or blocked), we fall back to a dev console log so an event is
 * never swallowed without a trace. In production with the script present the
 * event reaches Vercel; locally it is observable in the console.
 *
 * FOLLOW-UP: install `@vercel/analytics` to get the React `<Analytics/>` mount +
 * `track()` with dev debug + type defs; this module is the seam that swaps to it.
 */

/** The events this app emits. Keep the union closed so call sites are typed. */
export type AnalyticsEvent =
  | 'cta_click'
  | 'signup_start'
  | 'signup_complete'
  | 'contact_submit'

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>

declare global {
  interface Window {
    // Vercel Analytics injects this queue/dispatch global when its script loads.
    va?: (event: 'event' | 'beforeSend' | 'pageview', props?: unknown) => void
  }
}

/**
 * Fire a custom analytics event. Safe on the server (no-op) and safe when the
 * Vercel runtime is absent (dev console fallback) — never throws, never silently
 * drops.
 */
export function track(name: AnalyticsEvent, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return

  const va = window.va
  if (typeof va === 'function') {
    va('event', { name, ...props })
    return
  }

  // Runtime not present (analytics script not loaded / blocked) → leave a trace
  // rather than swallowing the event.
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[analytics] ${name}`, props ?? {})
  }
}
