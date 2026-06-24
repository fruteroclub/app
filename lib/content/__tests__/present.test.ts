import { describe, it, expect } from 'vitest'

import type { ArticleMeta } from '@fruteroclub/content'

import { categoryLabel, formatArticleDate, toCard, toMagazinePageProps } from '../present'

const meta: ArticleMeta = {
  slug: '2026-06-22-monad-demo-night',
  lang: 'es',
  title: 'Noche de Demos',
  dek: 'Una noche de demos.',
  date: '2026-06-22',
  author: { name: 'Valeria Cruz', handle: 'vcruz' },
  category: 'guia',
  topic: 'Research',
  accent: 'magenta',
  glyph: 'search',
  collector: '103/120',
  cover: { src: 'cover-seed', alt: 'alt' },
  sourceUrls: ['https://example.com/x'],
  featured: false,
}

describe('present mappers', () => {
  it('localizes category labels', () => {
    expect(categoryLabel('guia', 'es')).toBe('Guía')
    expect(categoryLabel('guia', 'en')).toBe('Guide')
    expect(categoryLabel('logro', 'en')).toBe('Achievement')
  })

  it('formats the date deterministically (UTC, compact, uppercase)', () => {
    expect(formatArticleDate('2026-06-22', 'es')).toBe('22 JUN 2026')
    // en-US short month order — just assert it is stable + uppercase + has the year.
    const en = formatArticleDate('2026-06-22', 'en')
    expect(en).toBe(en.toUpperCase())
    expect(en).toContain('2026')
  })

  it('toCard maps to CommunityCardData with the handle as the stat', () => {
    const card = toCard(meta, 'es')
    expect(card).toMatchObject({
      id: '2026-06-22-monad-demo-night',
      category: 'Guía',
      topic: 'Research',
      accent: 'magenta',
      glyph: 'search',
      collector: '103/120',
      title: 'Noche de Demos',
      author: 'Valeria Cruz',
      stat: '@vcruz',
    })
    expect(card.time).toBe('22 JUN 2026')
  })

  it('toMagazinePageProps points the CTA at the first source URL', () => {
    const props = toMagazinePageProps(meta, 'en', 'Source')
    expect(props.cta).toEqual({ label: 'Source', href: 'https://example.com/x' })
    expect(props.coverSeed).toBe('cover-seed')
    expect(props.category).toBe('Guide')
  })

  it('toMagazinePageProps leaves an empty CTA slot when there is no source', () => {
    const props = toMagazinePageProps({ ...meta, sourceUrls: [] }, 'es', 'Fuente')
    expect(props.cta).toEqual({ label: '', href: '#', soonLabel: '' })
  })
})
