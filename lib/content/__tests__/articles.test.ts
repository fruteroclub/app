import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * §7 reader paths: getAllArticles/getArticle (hit + miss), latest(n) sort desc,
 * assertUniqueSlugs collision (build-fail), reader token failure (throws — never a
 * silent partial). The Keystatic reader + the GitHub trees API are mocked; the real
 * `ArticleMeta` parse runs so a schema/frontmatter mismatch would surface here too.
 */

const { mockRead } = vi.hoisted(() => ({ mockRead: vi.fn() }))

vi.mock('server-only', () => ({}))
vi.mock('@/keystatic.config', () => ({ default: {} }))
vi.mock('@keystatic/core/reader/github', () => ({
  createGitHubReader: () => ({
    collections: {
      postsEs: { read: (slug: string) => mockRead('es', slug) },
      postsEn: { read: (slug: string) => mockRead('en', slug) },
    },
  }),
}))

import {
  assertUniqueSlugs,
  listSlugs,
  getArticle,
  getAllArticles,
  latest,
} from '../articles'

interface EntryOverrides {
  title?: string
  date?: string
  sourceUrls?: string[]
  featured?: boolean
}

function entry(over: EntryOverrides = {}) {
  return {
    title: over.title ?? 'Título',
    dek: 'Dek',
    date: over.date ?? '2026-06-22',
    author: { name: 'N', handle: 'h' },
    category: 'logro',
    topic: 'Monad',
    accent: 'magenta',
    glyph: 'star',
    collector: '001/120',
    cover: { src: 's', alt: 'a' },
    sourceUrls: over.sourceUrls ?? [],
    featured: over.featured ?? false,
    content: async () => 'cuerpo',
  }
}

function mockTree(slugs: string[]) {
  const tree = slugs.flatMap((s) => [
    { path: `posts/${s}`, type: 'tree' },
    { path: `posts/${s}/es.mdx`, type: 'blob' },
    { path: `posts/${s}/en.mdx`, type: 'blob' },
  ])
  tree.push({ path: 'README.md', type: 'blob' })
  globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ tree }) })) as never
}

beforeEach(() => {
  mockRead.mockReset()
  // default: every slug reads back a valid entry whose date is its slug prefix.
  mockRead.mockImplementation((_lang: string, slug: string) =>
    Promise.resolve(entry({ title: slug, date: slug.slice(0, 10) })),
  )
})

describe('assertUniqueSlugs', () => {
  it('passes for unique slugs', () => {
    expect(() => assertUniqueSlugs(['a', 'b', 'c'])).not.toThrow()
  })
  it('throws on a collision (build-fail)', () => {
    expect(() => assertUniqueSlugs(['a', 'b', 'a'])).toThrow(/duplicate slug/)
  })
})

describe('listSlugs', () => {
  it('extracts slugs from posts/<slug>/es.mdx, sorted', async () => {
    mockTree(['2026-06-22-b', '2026-06-18-c', '2026-06-20-a'])
    expect(await listSlugs()).toEqual(['2026-06-18-c', '2026-06-20-a', '2026-06-22-b'])
  })

  it('THROWS on a tree fetch failure (token/rate — never a silent partial)', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })) as never
    await expect(listSlugs()).rejects.toThrow(/GITHUB_TOKEN/)
  })

  it('THROWS on a truncated tree (partial corpus would drop pages — DEC-7)', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ truncated: true, tree: [{ path: 'posts/2026-06-22-a/es.mdx', type: 'blob' }] }),
    })) as never
    await expect(listSlugs()).rejects.toThrow(/truncated/)
  })
})

describe('getArticle', () => {
  it('returns parsed meta + body on a hit', async () => {
    const article = await getArticle('2026-06-22-x-y', 'es')
    expect(article).not.toBeNull()
    expect(article!.meta.slug).toBe('2026-06-22-x-y')
    expect(article!.meta.lang).toBe('es')
    expect(article!.body).toBe('cuerpo')
  })

  it('returns null on a miss', async () => {
    mockRead.mockResolvedValueOnce(null)
    expect(await getArticle('2026-06-22-missing', 'en')).toBeNull()
  })
})

describe('getAllArticles + latest', () => {
  it('reads every slug', async () => {
    mockTree(['2026-06-20-a', '2026-06-22-b'])
    const all = await getAllArticles('es')
    expect(all.map((a) => a.meta.slug)).toEqual(['2026-06-20-a', '2026-06-22-b'])
  })

  it('latest(n) sorts by date desc and slices', async () => {
    mockTree(['2026-06-20-a', '2026-06-22-b', '2026-06-18-c'])
    const top2 = await latest(2, 'es')
    expect(top2.map((a) => a.meta.date)).toEqual(['2026-06-22', '2026-06-20'])
    expect(await latest(0, 'es')).toEqual([])
    expect((await latest(99, 'es')).length).toBe(3)
  })

  it('latest() puts FEATURED posts first, regardless of date', async () => {
    mockTree(['2026-06-22-newest', '2026-06-18-featured-old'])
    mockRead.mockImplementation((_lang: string, slug: string) =>
      Promise.resolve(
        entry({ title: slug, date: slug.slice(0, 10), featured: slug.includes('featured') }),
      ),
    )
    const top = await latest(2, 'es')
    // The older but featured post leads the newer non-featured one.
    expect(top[0].meta.slug).toBe('2026-06-18-featured-old')
    expect(top[0].meta.featured).toBe(true)
    expect(top[1].meta.slug).toBe('2026-06-22-newest')
  })
})
