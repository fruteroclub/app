import 'server-only'

import { createGitHubReader } from '@keystatic/core/reader/github'
import { ArticleMeta, type ArticleMeta as ArticleMetaType } from '@fruteroclub/content'

import keystaticConfig from '@/keystatic.config'

/**
 * Build-time reader for the news corpus (`fruteroclub/content`), per DEC-1/DEC-7.
 *
 * Reads at BUILD via the Keystatic GitHub reader — no local clone. A token/rate
 * failure THROWS (fails the build; the last good edition stays live), never a
 * silent partial. Every entry is re-asserted against the `ArticleMeta` zod schema
 * imported from the content repo (the single source of truth), so frontmatter that
 * drifts from the schema fails the build.
 *
 * ── slug + lang are PATH-DERIVED (plan §12) ────────────────────────────────────
 * Keystatic's reader `list()`/`all()` do NOT support a slug *suffix* path
 * (`posts/*\/<lang>`): the compiled `listCollection` only matches slug *files*
 * directly under the base path, so our slug *directories* are dropped → `[]`.
 * `read(slug)` works fine. So we enumerate slugs via the SAME GitHub trees API the
 * reader uses internally (`listSlugs`), then `read` each through the reader. `slug`
 * comes from the directory; `lang` from the collection — neither lives in
 * frontmatter. `fields.mdx` returns a lazy `() => Promise<string>` — we await it.
 */

const REPO = 'fruteroclub/content'
const REF = 'main'

export type Lang = 'es' | 'en'

export interface Article {
  meta: ArticleMetaType
  /** The MDX/markdown source body (rendered by the article route). */
  body: string
}

const reader = createGitHubReader(keystaticConfig, {
  repo: REPO,
  ref: REF,
  token: process.env.GITHUB_TOKEN,
})

interface TreeEntry {
  path: string
  type: string
}

/** Fetch the repo tree (build-time). Throws on any non-OK response (DEC-7). */
async function fetchTree(): Promise<TreeEntry[]> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/git/trees/${REF}?recursive=1`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    },
  )
  if (!res.ok) {
    throw new Error(
      `content: failed to fetch the content tree (${res.status} ${res.statusText}). ` +
        `A valid GITHUB_TOKEN is required at build (DEC-7: never silently drop pages).`,
    )
  }
  const json = (await res.json()) as { tree?: TreeEntry[]; truncated?: boolean }
  // recursive=1 caps at ~100k entries; a truncated response is a partial corpus →
  // would silently drop articles. Fail the build instead (DEC-7).
  if (json.truncated) {
    throw new Error(
      'content: the GitHub tree response was truncated (corpus exceeds the recursive ' +
        'tree limit) — cannot enumerate all articles without dropping pages (DEC-7).',
    )
  }
  return json.tree ?? []
}

/**
 * Throws on a duplicate slug (build-fail). Slugs are directory names so the
 * filesystem already prevents collisions, but this is the explicit guard the
 * test contract and DEC require.
 */
export function assertUniqueSlugs(slugs: readonly string[]): void {
  const seen = new Set<string>()
  for (const slug of slugs) {
    if (seen.has(slug)) {
      throw new Error(`content: duplicate slug "${slug}" — slugs must be unique (build-fail).`)
    }
    seen.add(slug)
  }
}

/** All post slugs, sorted. A post exists iff `posts/<slug>/es.mdx` is present
 *  (CI guarantees `en.mdx` too). */
export async function listSlugs(): Promise<string[]> {
  const tree = await fetchTree()
  const slugs = tree
    .filter((e) => e.type === 'blob' && /^posts\/[^/]+\/es\.mdx$/.test(e.path))
    .map((e) => e.path.split('/')[1])
  assertUniqueSlugs(slugs)
  return slugs.sort()
}

/** Read one article in one locale. Returns null on a missing entry. */
export async function getArticle(slug: string, lang: Lang): Promise<Article | null> {
  const collection = lang === 'en' ? reader.collections.postsEn : reader.collections.postsEs
  const entry = await collection.read(slug)
  if (!entry) return null

  // Re-assert against the source-of-truth schema (build-fail on drift). slug + lang
  // are injected from the path; everything else is frontmatter.
  const meta = ArticleMeta.parse({
    slug,
    lang,
    title: entry.title,
    dek: entry.dek && entry.dek.trim() ? entry.dek : undefined,
    date: entry.date,
    author: entry.author,
    category: entry.category,
    topic: entry.topic,
    accent: entry.accent,
    glyph: entry.glyph,
    collector: entry.collector,
    cover: entry.cover,
    sourceUrls: (entry.sourceUrls ?? []).filter((u): u is string => Boolean(u)),
  })

  const body = await entry.content()
  return { meta, body }
}

/** Every article in a locale, in corpus order (sort with `latest`). */
export async function getAllArticles(lang: Lang): Promise<Article[]> {
  const slugs = await listSlugs()
  const articles: Article[] = []
  for (const slug of slugs) {
    const article = await getArticle(slug, lang)
    if (article) articles.push(article)
  }
  return articles
}

/** The newest `n` articles in a locale, sorted by `date` descending. */
export async function latest(n: number, lang: Lang): Promise<Article[]> {
  const all = await getAllArticles(lang)
  return all
    .slice()
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : a.meta.date > b.meta.date ? -1 : 0))
    .slice(0, Math.max(0, n))
}
