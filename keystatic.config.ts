import { config, collection, fields } from '@keystatic/core'

import { ACCENTS, CATEGORIES, GLYPHS } from '@fruteroclub/content'

/**
 * Keystatic config — Noticias pipeline (Phase 1).
 *
 * ── CONTENT MODEL (settled in the T1 spike, see plan §12) ──────────────────────
 * Two locale collections (`postsEs` + `postsEn`), NOT one collection with both
 * bodies. `path: 'posts/*\/<lang>'` + `format.contentField` resolves each entry to
 * `posts/<slug>/<lang>.mdx` (frontmatter + body in one file, per Keystatic's
 * `getCollectionItemPath`/`getEntryDataFilepath`). The `*` slug directory is SHARED
 * across the two collections, so ES + EN are tied to one immutable slug (DEC-5).
 * `reader.collections.postsEs.read(slug)` / `postsEn.read(slug)` read the two files.
 *
 * ── DRY (DEC-DRY) ──────────────────────────────────────────────────────────────
 * The zod `ArticleMeta` in `@fruteroclub/content` (schema/article.ts) is the single
 * source of truth. This collection schema MIRRORS it; the enums are imported, not
 * re-declared, so they cannot drift. The app build re-asserts every read entry via
 * `ArticleMeta.parse` (lib/content/articles.ts) — so a schema/frontmatter mismatch
 * fails the build.
 *
 * ── slug + lang are PATH-DERIVED, not frontmatter ──────────────────────────────
 * The reader returns `entry.slug` (= the `*` directory) for the slugField; `lang`
 * is the collection identity (postsEs/postsEn). Neither is stored in frontmatter.
 * The `name` part of the slug field is the human label only (admin UI); the reader
 * yields the directory slug. `fields.mdx`'s reader value is a LAZY async accessor
 * `() => Promise<string>` — `await entry.content()`.
 *
 * The `/keystatic` admin UI (DEC-13) is NOT mounted yet (highest Next-16 surface,
 * out of the T2/T3 P1-core scope); it is layered on separately.
 */

const toOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: value, value }))

// Mirrors §5 ArticleMeta. `slug` (the URL slug) and `lang` are derived from the
// path, so they are NOT schema fields here beyond the required slugField, whose
// reader value IS the directory slug. `content` is the MDX body (contentField).
const articleSchema = {
  slug: fields.slug({ name: { label: 'Slug name' } }),
  title: fields.text({ label: 'Title', validation: { length: { min: 1, max: 120 } } }),
  dek: fields.text({ label: 'Dek', multiline: true }),
  date: fields.date({ label: 'Date' }),
  author: fields.object(
    {
      name: fields.text({ label: 'Author name' }),
      handle: fields.text({ label: 'Author handle' }),
    },
    { label: 'Author' },
  ),
  category: fields.select({
    label: 'Category',
    options: toOptions(CATEGORIES),
    defaultValue: 'noticia',
  }),
  topic: fields.text({ label: 'Topic' }),
  accent: fields.select({
    label: 'Accent',
    options: toOptions(ACCENTS),
    defaultValue: 'magenta',
  }),
  glyph: fields.select({
    label: 'Glyph',
    options: toOptions(GLYPHS),
    defaultValue: 'star',
  }),
  collector: fields.text({ label: 'Collector index' }),
  cover: fields.object(
    {
      src: fields.text({ label: 'Cover src' }),
      alt: fields.text({ label: 'Cover alt' }),
    },
    { label: 'Cover' },
  ),
  sourceUrls: fields.array(fields.url({ label: 'Source URL' }), {
    label: 'Source URLs',
    itemLabel: (props) => props.value ?? 'URL',
  }),
  featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
  content: fields.mdx({ label: 'Body' }),
}

const keystaticConfig = config({
  storage: {
    kind: 'github',
    repo: 'fruteroclub/content',
  },
  collections: {
    postsEs: collection({
      label: 'Posts (ES)',
      slugField: 'slug',
      path: 'posts/*/es',
      format: { contentField: 'content' },
      schema: articleSchema,
    }),
    postsEn: collection({
      label: 'Posts (EN)',
      slugField: 'slug',
      path: 'posts/*/en',
      format: { contentField: 'content' },
      schema: articleSchema,
    }),
  },
})

export default keystaticConfig
