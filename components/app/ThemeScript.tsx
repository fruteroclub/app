/**
 * No-flash arcade theme script (T7).
 *
 * The authed `(app)` group renders in arcade-dark mode (D-mode: marketing is
 * paper-only, arcade lives only in the authed dopamine screens). The parent
 * `[locale]/layout.tsx` statically renders `<html data-mode="paper">`, so without
 * intervention the app would paint PAPER for one frame, then flip to arcade after
 * hydration — a flash on every authed load.
 *
 * This component emits an inline script that runs BEFORE first paint (it executes
 * synchronously where it is placed at the top of the (app) subtree) and sets
 * `data-mode="arcade"` on `<html>` immediately. It honours a persisted override
 * in `localStorage['club-mode']` if present (future per-user toggle inside the
 * app), defaulting to arcade. The functional `arcade-mode.tsx` effect still runs
 * to revert the attribute on unmount (navigating back to marketing) — this script
 * just removes the first-paint flash, exactly as the failure-mode table requires
 * ("theme (app) hydration mismatch → no-flash inline localStorage script").
 *
 * `dangerouslySetInnerHTML` is the standard Next pattern for a pre-paint inline
 * script; the content is a static literal (no interpolation, no injection vector).
 */
const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem('club-mode')||'arcade';document.documentElement.setAttribute('data-mode',m);document.documentElement.style.colorScheme=m==='arcade'?'dark':'light';}catch(e){document.documentElement.setAttribute('data-mode','arcade');}})();`

export function ThemeScript() {
  return (
    <script
      // Pre-paint, no-flash mode set. Must run before React hydrates the subtree.
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  )
}
