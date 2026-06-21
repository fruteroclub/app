'use client'

import { useEffect } from 'react'

/**
 * Switches the document into arcade-dark mode for the authed (app) group only
 * (D-mode: public marketing is paper-only; arcade lives in the app's dopamine
 * screens). DESIGN.md scopes arcade tokens to `html[data-mode="arcade"]`.
 *
 * The parent `[locale]/layout.tsx` renders `<html data-mode="paper">` statically,
 * so arcade is applied here on mount and reverted on unmount (when the user
 * navigates back to a marketing route). A no-flash inline pre-paint script is
 * T7's job — this is the functional seam it will replace.
 */
export default function ArcadeMode() {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.getAttribute('data-mode')
    root.setAttribute('data-mode', 'arcade')
    return () => {
      root.setAttribute('data-mode', previous ?? 'paper')
    }
  }, [])
  return null
}
