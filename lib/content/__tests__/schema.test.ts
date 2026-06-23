import { describe, it, expect } from 'vitest'

import { ArticleMeta, toErc721 } from '@fruteroclub/content'

/**
 * Contract tests for the content-repo schema the app depends on (§7: ArticleMeta
 * valid / missing-required / bad slug / bad lang; toErc721 shape). Importing from
 * `@fruteroclub/content` asserts the published source-of-truth, not a local copy.
 */

const valid = {
  slug: '2026-06-22-monad-demo-night',
  lang: 'es' as const,
  title: 'Noche de Demos',
  dek: 'Una noche de demos.',
  date: '2026-06-22',
  author: { name: 'Redacción', handle: 'frutero' },
  category: 'logro' as const,
  topic: 'Monad',
  accent: 'magenta' as const,
  glyph: 'star' as const,
  collector: '001/120',
  cover: { src: 'seed', alt: 'alt text' },
  sourceUrls: ['https://example.com/a'],
}

describe('ArticleMeta', () => {
  it('accepts a valid record (and defaults sourceUrls)', () => {
    const parsed = ArticleMeta.parse(valid)
    expect(parsed.slug).toBe(valid.slug)
    const { sourceUrls, ...noUrls } = valid
    void sourceUrls
    expect(ArticleMeta.parse(noUrls).sourceUrls).toEqual([])
  })

  it('rejects a missing required field (title)', () => {
    const { title, ...rest } = valid
    void title
    expect(ArticleMeta.safeParse(rest).success).toBe(false)
  })

  it('rejects a non date-prefixed slug', () => {
    expect(ArticleMeta.safeParse({ ...valid, slug: 'monad-demo-night' }).success).toBe(false)
  })

  it('rejects an unknown lang', () => {
    expect(ArticleMeta.safeParse({ ...valid, lang: 'fr' }).success).toBe(false)
  })

  it('rejects an unknown category and a bad collector format', () => {
    expect(ArticleMeta.safeParse({ ...valid, category: 'opinion' }).success).toBe(false)
    expect(ArticleMeta.safeParse({ ...valid, collector: '1/2' }).success).toBe(false)
  })

  it('requires cover.alt', () => {
    expect(ArticleMeta.safeParse({ ...valid, cover: { src: 's', alt: '' } }).success).toBe(false)
  })
})

describe('toErc721', () => {
  const meta = ArticleMeta.parse(valid)
  const json = toErc721(meta, 'https://frutero.club')

  it('maps display traits into attributes[]', () => {
    expect(json.name).toBe(meta.title)
    expect(json.external_url).toBe('https://frutero.club/noticias/2026-06-22-monad-demo-night')
    expect(json.image).toBe(
      'https://frutero.club/noticias/2026-06-22-monad-demo-night/opengraph-image',
    )
    const byType = Object.fromEntries(json.attributes.map((a) => [a.trait_type, a.value]))
    expect(byType.category).toBe('logro')
    expect(byType.author).toBe('@frutero')
    expect(byType.lang).toBe('es')
    expect(byType.date).toBe('2026-06-22')
  })

  it('keeps properties{} minimal (slug + source_urls only)', () => {
    expect(json.properties).toEqual({
      slug: '2026-06-22-monad-demo-night',
      source_urls: ['https://example.com/a'],
    })
  })
})
