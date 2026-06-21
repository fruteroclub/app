import { describe, it, expect } from 'vitest'

import {
  SITE_URL,
  localizedUrl,
  buildAlternates,
  buildMetadata,
} from './seo'

/**
 * Unit tests for the SEO canonical / hreflang logic (T7). This is the
 * load-bearing part: D-locale (`as-needed`) means ES is the bare apex and `/es`
 * must NEVER appear in a canonical or alternate, while EN lives under `/en`.
 */
describe('localizedUrl', () => {
  it('serves ES at the bare apex (no /es prefix)', () => {
    expect(localizedUrl('es', '/')).toBe(`${SITE_URL}/`)
    expect(localizedUrl('es', '/enterprise')).toBe(`${SITE_URL}/enterprise`)
  })

  it('prefixes EN with /en', () => {
    expect(localizedUrl('en', '/')).toBe(`${SITE_URL}/en`)
    expect(localizedUrl('en', '/enterprise')).toBe(`${SITE_URL}/en/enterprise`)
  })

  it('never emits an /es prefix', () => {
    expect(localizedUrl('es', '/enterprise')).not.toContain('/es/')
  })
})

describe('buildAlternates', () => {
  it('self-canonical points at the current locale URL', () => {
    expect(buildAlternates('en', '/enterprise')?.canonical).toBe(
      `${SITE_URL}/en/enterprise`,
    )
    expect(buildAlternates('es', '/enterprise')?.canonical).toBe(
      `${SITE_URL}/enterprise`,
    )
  })

  it('hreflang covers both locales plus x-default → ES', () => {
    const langs = buildAlternates('es', '/') ?.languages as Record<string, string>
    expect(langs['es-MX']).toBe(`${SITE_URL}/`)
    expect(langs['en-US']).toBe(`${SITE_URL}/en`)
    expect(langs['x-default']).toBe(`${SITE_URL}/`)
  })
})

describe('buildMetadata', () => {
  it('uses an absolute title (not wrapped by the brand template)', () => {
    const meta = buildMetadata({
      locale: 'es',
      path: '/',
      title: 'Frutero Club — Sube de nivel',
      description: 'desc',
    })
    expect(meta.title).toEqual({ absolute: 'Frutero Club — Sube de nivel' })
  })

  it('sets OG url + type and a summary_large_image twitter card', () => {
    const meta = buildMetadata({
      locale: 'en',
      path: '/enterprise',
      title: 'x',
      description: 'y',
    })
    expect(meta.openGraph).toMatchObject({
      type: 'website',
      url: `${SITE_URL}/en/enterprise`,
      locale: 'en_US',
    })
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' })
  })

  it('emits noindex robots when index:false', () => {
    const meta = buildMetadata({
      locale: 'es',
      path: '/',
      title: 'x',
      description: 'y',
      index: false,
    })
    expect(meta.robots).toEqual({ index: false, follow: false })
  })
})
