import { Bitter, Geist, IBM_Plex_Mono, Petrona } from 'next/font/google'

/**
 * The 4-font system (DESIGN.md):
 * - Bitter   → --display (slab, headers / impact)
 * - Geist    → --sans    (grotesk, UI / body)
 * - IBM Plex → --mono    (technical spine: numerals, indices, labels)
 * - Petrona  → --serif   (editorial reading — LAZY: only on routes that opt in)
 *
 * Bitter, Geist, and IBM Plex Mono are always loaded (their CSS vars hang off the
 * three exports composed in the root layout). Petrona is exported separately so
 * editorial routes can add `petrona.variable` to their subtree without paying the
 * download cost on marketing/data pages.
 */

export const bitter = Bitter({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

/** Editorial serif — load ONLY on routes that render long-form/editorial copy. */
export const petrona = Petrona({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

/** className bundle for the three always-on fonts (apply on <html> in root layout). */
export const baseFontVariables = `${bitter.variable} ${geist.variable} ${ibmPlexMono.variable}`
