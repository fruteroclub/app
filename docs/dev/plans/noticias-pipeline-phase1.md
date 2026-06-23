# Implementation Plan — Noticias Pipeline (Phase 1)

> **Kickoff prompt (ultracode):**
> "Implement `docs/dev/plans/noticias-pipeline-phase1.md`. Start with T1 (the spike) and
> do not proceed to T2+ until the spike's exit check passes. Follow the decisions and
> acceptance checks verbatim; ask only if a decision here conflicts with the code."

Status: **APPROVED, eng-cleared 2026-06-22** (scope reduced to Phase 1).
Source design doc (supplementary): `~/.gstack/projects/club-app/mel-main-design-20260622-112425.md`.
This plan is self-contained — every decision is inlined below.

---

## 1. Goal

Load the landing's news/dispatches dynamically and let an agent (**Hermes**) draft them.
News is a **growth surface** (SEO + AEO + social) that will later feed the Phase 2
opportunity directory. Phase 1 builds the **editorial pipeline only**.

Today the news is hardcoded stubs: `content/cards.ts` (`COMMUNITY_CARDS`) and
`content/landing.ts` (`LATEST_POSTS`, every `href: "#"`), rendered by
`components/marketing/LatestMagazine.tsx` (#7) + the hero rail. There are no article pages.

## 2. Architecture (two repos, daily edition)

```
fruteroclub/content (NEW, external, PUBLIC)          fruteroclub/app (THIS repo)
  schema/article.ts   <- zod ArticleMeta (SOURCE)      npm i github:fruteroclub/content
  posts/<slug>/es.mdx                                  createGitHubReader -> reads posts @ build
  posts/<slug>/en.mdx                                  /noticias routes (force-static, ES+EN)
  posts/<slug>/cover.*                                 /noticias/[slug]/metadata.json (ERC-721)
  .github/workflows/validate.yml  (CI gate, every PR) .github/workflows/daily-edition.yml (cron)
  keystatic edits via /keystatic (in the app)         imports ArticleMeta for build-assert + types
```

Contributions land in the content repo anytime; the site rebuilds **once/day at
00:00 America/Mexico_City** (the "daily edition"). A human merge is the quality gate.

## 3. Hard rules (do not violate)

- **Vocab ban** (`crypto-subtle-lead-with-verifiable`): no "onchain/web3/crypto/NFT/
  decentralized" in **rendered article copy or UI**. The metadata is ERC-721-shaped in
  CODE only. Lead with "verifiable". The merge checklist enforces this for content.
- **Bilingual required**: every post ships **ES + EN**. A post missing either locale
  fails validation and never publishes. No mixed-language fallback page.
- **Paper-only**: `/noticias` is a public marketing surface → editorial/paper register,
  FLAT (no arcade, no neobrutalist offset shadows). Reuse the existing newsprint system.
- **ES-first i18n**: `localePrefix: 'as-needed'` — ES is the bare apex `/noticias/<slug>`,
  EN is `/en/noticias/<slug>`. Always use `@/i18n/navigation` `Link`, never bare `next/link`.
- **DRY**: zod `ArticleMeta` is the single source of truth. Types via `z.infer`. The
  Keystatic collection mirrors it; the build asserts every entry against it (drift = build fail).
- **Brand white on dark** (`frutero-white-on-dark-fffbf5`) and **editorial-not-vaporwave**
  (`frutero-cabinet-editorial-not-vaporwave`) — only relevant if any dark band is touched (it isn't here).

## 4. Decisions (inlined from the eng review — authoritative)

| # | Decision |
|---|---|
| DEC-1 | Read external repo at build via Keystatic **GitHub reader** `createGitHubReader(config, { repo:'fruteroclub/content', ref:'main', token: process.env.GITHUB_TOKEN })`. NO local clone. Build needs `GITHUB_TOKEN` (App token / least-priv PAT) for the 5,000/hr API ceiling. |
| DEC-2 | zod `ArticleMeta` **lives in the content repo** (`schema/article.ts`). Content-repo CI parses every post (ES+EN) per PR — malformed OR non-bilingual fails before merge. App `npm i github:fruteroclub/content` to import it. |
| DEC-3 | Metadata is **article-only ERC-721**, served by a **route handler** `/noticias/[slug]/metadata.json` (NOT a file in `public/`). `properties{}` minimal: `slug`, `source_urls`. |
| DEC-4 | Routes `/noticias/[slug]` (ES apex) + `/en/noticias/<slug>` + `/noticias` index. `force-static`. `generateStaticParams` emits both locales per slug. Both languages always exist. Safety net: a somehow-missing locale renders `noindex` + is dropped from sitemap. Latest 6 → Lo último #7; latest 4 → hero rail; sort by `date` desc; zero → "pronto" empty state. |
| DEC-5 | `slug` is **date-prefixed and immutable**, shared across locales (`2026-06-22-monad-demo-night`). Title change ≠ slug change. |
| DEC-6 | `cover` committed in the content repo next to the post; `cover.alt` **required** in schema; `next/image` with explicit dimensions; missing cover → default brand cover. R2 deferred. |
| DEC-7 | Extend `lib/seo.ts` with `NewsArticle` JSON-LD fed into the existing `@graph`; feed `/noticias/*` into sitemap + hreflang; a `GITHUB_TOKEN` failure **fails the build** (never silently drops pages). |
| DEC-8 | AEO = ship the hygiene (semantic HTML, structured data, canonical, fast static, `llms.txt`, `FAQPage` where it fits). Do not overclaim it; real leverage is sourcing/authority/links. |
| DEC-9 | Per-route OG: `/noticias/[slug]/opengraph-image` (file convention does NOT cascade to `[locale]` — known gotcha, wire per route). OG doubles as metadata `image`. |
| DEC-10 | Daily cron in **app repo** `.github/workflows/daily-edition.yml` (`0 6 * * *` UTC = 00:00 UTC-6, DST-free), curls a Vercel Deploy Hook, **notify-on-failure**. Manual `workflow_dispatch` = publish-now. App-repo hosting avoids GitHub's 60-day-idle auto-disable. |
| DEC-11 | Hermes emits TWO `.mdx` (ES+EN) conforming to `ArticleMeta` + citation rules (link+summarize, never copy; `source_urls[]`; dup-URL check). Opens a PR or edits via `/keystatic`. |
| DEC-12 | Merge checklist (human): accuracy, vocab ban, SEO title/dek, image rights+alt, bilingual completeness, schema validity (last two automated by CI). |
| DEC-13 | `/keystatic` route is access-controlled (Keystatic GitHub mode + GitHub App; not publicly writable). |
| DEC-14 | **Article page UI = "Lo último" in its own route** (Mel): `/noticias/[slug]` reuses `MagazinePage` (`components/marketing/MagazinePage.tsx`) standalone + back-nav to `/noticias`; the index reuses the `LatestMagazine` layout. No new template, no separate design review. |

## 5. The schema (content repo `schema/article.ts`) — write this first

```ts
import { z } from 'zod'

export const CATEGORIES = ['logro', 'evento', 'noticia', 'guia', 'bitacora'] as const
export const ACCENTS = ['magenta', 'green', 'orange', 'muted'] as const
export const GLYPHS = ['star', 'hex', 'diamond', 'grid', 'search', 'bolt'] as const // mirror components/Glyph.tsx names

// One language version of a post. ES and EN share `slug`, differ by `lang`.
export const ArticleMeta = z.object({
  slug: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/), // DEC-5 date-prefixed, immutable
  lang: z.enum(['es', 'en']),
  title: z.string().min(1).max(120),
  dek: z.string().max(280).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  author: z.object({ name: z.string().min(1), handle: z.string().min(1) }),
  category: z.enum(CATEGORIES),
  topic: z.string().min(1),
  accent: z.enum(ACCENTS),
  glyph: z.enum(GLYPHS),
  collector: z.string().regex(/^\d{3}\/\d{3}$/), // "001/120"
  cover: z.object({ src: z.string().min(1), alt: z.string().min(1) }), // DEC-6 alt required
  sourceUrls: z.array(z.string().url()).default([]), // DEC-11
})
export type ArticleMeta = z.infer<typeof ArticleMeta>

// DEC-3: article -> ERC-721 metadata. Display traits in attributes; internal in properties.
export function toErc721(m: ArticleMeta, siteUrl: string) {
  return {
    name: m.title,
    description: m.dek ?? '',
    image: `${siteUrl}/noticias/${m.slug}/opengraph-image`,
    external_url: `${siteUrl}/noticias/${m.slug}`,
    attributes: [
      { trait_type: 'category', value: m.category },
      { trait_type: 'author', value: `@${m.author.handle}` },
      { trait_type: 'date', value: m.date, display_type: 'date' },
      { trait_type: 'lang', value: m.lang },
    ],
    properties: { slug: m.slug, source_urls: m.sourceUrls },
  }
}
```

`COMMUNITY_CARDS` (`content/cards.ts:40`) is the field reference for what real posts look
like — migrate 2-3 of them into the new shape as seed posts. NOTE: their `stat`/`time`
strings carry "Nivel"/level copy — DROP level language when migrating (retired model).

## 6. Tasks

> Effort uses AI-compression (human / CC). P1 blocks ship; P2 same branch.

### T1 — SPIKE (P1, gates everything) — human ~half day / CC ~1h
Prove **Keystatic + Next 16 + GitHub reader** render one bilingual article before building the rest.
- Add `@keystatic/core`, `@keystatic/next` to `package.json`. Create a minimal `keystatic.config.ts`
  (GitHub storage, repo `fruteroclub/content`) and a throwaway `/noticias/[slug]` route that reads
  one post via `createGitHubReader` and renders title + body in ES and EN.
- Settle the **Keystatic content model** for bilingual posts (the one open modeling question):
  either two locale collections or one collection with both bodies. Document the choice in the config.
- **Exit check (MUST pass before T2):** one ES+EN `.mdx` renders at `/noticias/<slug>` and `/en/noticias/<slug>`
  on `next build` + `next start`. **If Keystatic fights Next 16**, fall back to `gray-matter` + `remark`
  (read the repo via the GitHub API tarball) and record the switch in this file's "Deviations" section.

### T2 — Content repo + schema + CI gate (P1) — human ~3h / CC ~30min
Repo: `fruteroclub/content` (PUBLIC).
- `schema/article.ts` = the §5 zod schema. `package.json` with `zod` + a `validate` script.
- Structure: `posts/<slug>/es.mdx`, `posts/<slug>/en.mdx`, `posts/<slug>/cover.*`.
- `validate` script: for every `posts/<slug>/`, parse `es.mdx` + `en.mdx` frontmatter →
  `ArticleMeta.parse`; assert BOTH locales present; assert `slug` unique across the corpus and
  equal to the directory name. Exit non-zero on any failure.
- `.github/workflows/validate.yml`:
  ```yaml
  name: validate
  on: { pull_request: {}, push: { branches: [main] } }
  jobs:
    validate:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: oven-sh/setup-bun@v2
        - run: bun install
        - run: bun run validate
  ```
- Seed 2-3 real bilingual posts migrated from `COMMUNITY_CARDS` (drop level copy).
- **Acceptance:** a PR with a malformed OR single-locale post goes red; a valid bilingual PR is green.

### T3 — Reader + routes + metadata handler (P1) — human ~half day / CC ~1h
In this app repo. `npm i github:fruteroclub/content` (imports `ArticleMeta`).
- `lib/content/articles.ts`:
  ```ts
  import { createGitHubReader } from '@keystatic/core/reader/github'
  import keystaticConfig from '@/keystatic.config'
  const reader = createGitHubReader(keystaticConfig, {
    repo: 'fruteroclub/content', ref: 'main', token: process.env.GITHUB_TOKEN!,
  })
  // getAllArticles(lang): ArticleMeta[]   (build-assert each via ArticleMeta.parse from the content-repo dep)
  // getArticle(slug, lang): ArticleMeta | null
  // latest(n, lang): ArticleMeta[]        (sort by date desc)
  // assertUniqueSlugs(): throws on collision  <-- called at module load / build
  ```
  On `GITHUB_TOKEN` failure: **throw** (DEC-7, fail the build). On slug collision: **throw**.
- Routes (route group `app/[locale]/(marketing)/`):
  - `noticias/page.tsx` — index. Reuse the `LatestMagazine` layout (DEC-14). `force-static`.
  - `noticias/[slug]/page.tsx` — article. `generateStaticParams` over (slug × {es,en}).
    Render via `MagazinePage` (`components/marketing/MagazinePage.tsx`) standalone + a back-link to
    `/noticias` (use `@/i18n/navigation` `Link`). `notFound()` on unknown slug. Missing-locale safety:
    `noindex` + omit from sitemap.
  - `noticias/[slug]/metadata.json/route.ts` — `GET` returns `toErc721(meta, SITE_URL)` as JSON.
- `force-static`: `export const dynamic = 'force-static'` on the routes (matches `(marketing)/page.tsx:48`).
- **Acceptance:** the 16-path test set in §7 passes; build fails on slug collision and on token failure.

### T4 — Repoint Lo último #7 + hero rail (P1, CRITICAL regression) — human ~2h / CC ~20min
- `components/marketing/LatestMagazine.tsx` (#7) and the hero rail currently read
  `COMMUNITY_CARDS` / `LATEST_POSTS`. Repoint them at `latest(6, lang)` / `latest(4, lang)`.
  Keep the `MagazineTabs` page-tabs mechanic and layout unchanged (`lo-ultimo-page-tabs`).
- Each card/spine links to `/noticias/<slug>` (real route, no more `"#"`).
- **Acceptance:** `components/marketing/__tests__/landing.test.tsx` stays green against the real
  source; zero-posts and fewer-than-N states render the "pronto" empty state.

### T5 — SEO / OG / sitemap (P2) — human ~2h / CC ~20min
- `lib/seo.ts`: add `articleJsonLd(locale, {title, dek, date, author, url, image})` returning a
  `NewsArticle` node tied to `publisher: { '@id': ${SITE_URL}/#organization }` (reuse the org id at
  `lib/seo.ts:121`). Render it on the article page. Use `buildMetadata({ locale, path: '/noticias/<slug>',
  title, description })` for article metadata (factory at `lib/seo.ts:164`).
- `app/sitemap.ts`: add every `/noticias/*` route (both locales) reading the same `getAllArticles`
  source; on token failure, FAIL (do not emit a partial sitemap).
- `app/[locale]/(marketing)/noticias/[slug]/opengraph-image.tsx` — per-route OG card (DEC-9; clone the
  pattern from `app/opengraph-image.tsx`, feed the article title/dek).
- `llms.txt` at the site root listing the news section (DEC-8, minimal).
- **Acceptance:** a built `/noticias/<slug>` has `NewsArticle` JSON-LD + a non-empty `og:image`
  (`grep og:image` on the built HTML); the route is in `sitemap.xml` with correct hreflang.

### T6 — Daily-edition cron (P2) — human ~1.5h / CC ~15min
- `app/.github/workflows/daily-edition.yml` (this repo):
  ```yaml
  name: Daily edition
  on:
    schedule: [{ cron: '0 6 * * *' }]   # 00:00 America/Mexico_City (UTC-6, DST-free)
    workflow_dispatch: {}               # manual publish-now (DEC-10)
  jobs:
    publish:
      runs-on: ubuntu-latest
      steps:
        - name: Trigger Vercel deploy
          run: |
            code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}")
            echo "deploy hook -> $code"; case "$code" in 200|201) ;; *) exit 1 ;; esac
        - name: Alert on failure
          if: failure()
          run: curl -fsS -X POST "${{ secrets.SLACK_WEBHOOK }}" -d '{"text":"⚠️ Daily edition deploy hook failed"}'
  ```
- **Acceptance:** `workflow_dispatch` triggers a Vercel deploy; a forced non-200 hits the alert step.

### T7 — Hermes contract + merge checklist (P2) — human ~1h / CC ~15min
In the content repo: `HERMES.md` (house style, `ArticleMeta` field guide, ES+EN requirement,
citation/excerpt rules, `source_urls[]`, dup-URL check) and `CONTRIBUTING.md` merge checklist (DEC-12,
incl. the vocab ban). Then run ONE real loop: URLs+notes → Hermes → bilingual PR → CI green → merge → live.

## 7. Test coverage contract (16 paths — write alongside the code, target 16/16)

```
content schema/article.ts ArticleMeta      [★★★] valid / missing-required / bad slug / bad lang
content CI validate (ES+EN per PR)          [★★★] CRITICAL: malformed OR single-locale -> fail
app toErc721()                              [★★★] attributes[] + minimal properties{}, lang/cover map
app lib/content/articles.ts
  getAllArticles / getArticle               [★★ ][→E2E] mock reader; hit + miss
  latest(n) sort desc                       [★★★] order, n>count, n===0
  assertUniqueSlugs()                        [★★★] CRITICAL: collision throws (build-fail)
  reader token failure                       [★★★] throws (build fails, no silent drop)
route /noticias/[slug]/metadata.json        [★★ ] valid ERC-721 (ArticleMeta round-trip)
/noticias/[slug]/page generateStaticParams  [★★ ] both locales per slug
  render found / notFound                    [★★★] render + NewsArticle JSON-LD; 404
  missing-locale safety                      [★★★] noindex + absent from sitemap
/noticias index + empty state               [★★★] lists latest; zero -> "pronto"
LatestMagazine #7 + hero rail repoint        [★★★] REGRESSION: landing.test.tsx green; zero/<N
lib/seo.ts NewsArticle                       [★★ ] shape (headline/datePublished/author/image)
/noticias/[slug]/opengraph-image             [★  ] smoke: returns image
daily-edition.yml                            [→E2E/manual] cron 0 6 * * * UTC, hook 200, alert on non-200
```
Test framework: **vitest** (`vitest.config.ts`, tests colocated as `*.test.ts(x)`); E2E via
`playwright.config.ts`. Match existing conventions (see `components/marketing/__tests__/`).

## 8. Failure modes (each must be tested OR handled + visible)

| Codepath | Failure | Handling |
|---|---|---|
| GitHub reader build | token missing/expired/rate-limit | build FAILS (DEC-7); last good edition stays live |
| content CI | bad/non-bilingual post | PR blocked red before merge |
| slug collision | two posts same slug | build throws (assertUniqueSlugs) |
| daily cron | Action fail / hook non-200 | notify-on-failure alert; manual hook recovers |
| missing-locale page | a locale absent | noindex + sitemap drop (no mixed-language indexed page) |

No failure mode is both untested AND silent.

## 9. Env / secrets

App (Vercel): `GITHUB_TOKEN` (content-repo read, ≥5k/hr), `NEXT_PUBLIC_SITE_URL`,
Keystatic GitHub App (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`).
App repo Actions secrets: `VERCEL_DEPLOY_HOOK`, `SLACK_WEBHOOK`.

## 10. Definition of done (Phase 1)

- A merged bilingual post is live at `/noticias/<slug>` (ES+EN) at the next 00:00 UTC-6 build
  (or via manual hook), with `NewsArticle` JSON-LD, an OG card, and a valid `/noticias/[slug]/metadata.json`.
- Lo último #7 + hero rail render real posts; `landing.test.tsx` green.
- Content-repo CI blocks malformed/non-bilingual posts.
- 16/16 test paths covered. `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, `npx next build` all green.
- One real Hermes loop completed end to end.

## 11. NOT in scope (Phase 2 or deferred)

Opportunity directory + member profiles (Neon/Drizzle), profile routes, `Person`/`ItemList`/`JobPosting`
JSON-LD, the member↔article↔opportunity flywheel, member OG cards, mint-readiness for non-article
entities, auto-post to X/Farcaster, editor preview against the real render, immutable dated editions,
reader-fetch build caching at scale, R2 media migration.

## 12. Deviations (implementer fills in)

_Record any decision that had to change during build (e.g. Keystatic→gray-matter fallback from T1),
with the reason. Keep DEC numbers._

### T1 spike outcome (2026-06-22) — PASSED, no fallback

Verified end to end: one bilingual post renders at `/noticias/<slug>` (ES) and
`/en/noticias/<slug>` (EN) on `next build` + `next start`, and both prerender to
static HTML. **Keystatic does NOT fight Next 16 — the `gray-matter` fallback was
not needed.** Findings (carry into T2/T3):

1. **Versions:** `@keystatic/core@0.5.50` + `@keystatic/next@5.0.4` build cleanly
   under Next 16.0.10 / Turbopack / React 19.2.1 (RSC `react-server` export of
   `@keystatic/core/reader/github` resolves fine). Compiled in ~6s, no patches.
2. **Content model DECIDED = two locale collections** (the open modeling question):
   `postsEs` (`path: 'posts/*/es'`) + `postsEn` (`path: 'posts/*/en'`), sharing the
   `*` slug directory. Grounded in Keystatic's path mapping
   (`getCollectionItemPath`/`getEntryDataFilepath`): `path` + `format.contentField`
   resolves to `posts/<slug>/<lang>.mdx` (frontmatter + body in one file) — the §2/T2
   on-disk layout VERBATIM, with ES+EN tied to one immutable slug (DEC-5). The choice
   is documented in `keystatic.config.ts`. (One-collection-both-bodies rejected:
   Keystatic allows only one `contentField`.)
3. **`fields.mdx` reader value is a LAZY async accessor `() => Promise<string>`**, not
   a plain string — `await entry.content()`. T3's `lib/content/articles.ts` must await
   it. (`fields.mdx` also needs `extension: 'mdx'` default → `.mdx` files.)
4. **`force-static` + `generateStaticParams` (returning slugs; parent `[locale]`
   supplies locales) prerenders BOTH locales to static HTML.** Build reads from
   `fruteroclub/content` and so needs `GITHUB_TOKEN`; `next start` serves the static
   HTML with NO runtime token (confirmed). This is the DEC-4/DEC-7 path working.
5. **Admin UI (`/keystatic`, DEC-13) deliberately NOT mounted in T1** — it is the
   highest Next-16 integration surface and is not exercised by the reader-only exit
   check. Mount + verify it under the DEC-13 work, separately from the reader path.
6. **`fruteroclub/content` was created (PUBLIC)** with one throwaway bilingual fixture
   post (`posts/2026-06-22-monad-demo-night/{es,en}.mdx`) to feed the spike. T2 builds
   the real schema/CI/seeds ON this repo; reconcile/replace the fixture there.
7. **Throwaway artifacts to reconcile in T3:** `app/[locale]/(marketing)/noticias/[slug]/page.tsx`
   is the spike route (inline reader, renders raw body string) — T3 replaces it with the
   `lib/content/articles.ts` reader + `MagazinePage` render. `keystatic.config.ts` schema
   is minimal (`slug`/`title`/`content`) — T2 swaps in the full §5 `ArticleMeta` shape.

### T2 + T3 outcome (2026-06-22) — DONE, all gates green

`tsc --noEmit`, `eslint`, `vitest` (131/131), and `next build` all pass; the content-repo
CI is green. Deviations + reconciliations (DEC numbers kept):

8. **`slug` + `lang` are PATH-DERIVED, not frontmatter** (reconciles §5's `slug`/`lang`
   fields with DEC-5). Keystatic ties the slug to the directory and the locale to the
   collection, so storing them in frontmatter would invite drift. The validate script and
   `lib/content/articles.ts` both inject `slug` (= dir) + `lang` (= `es`/`en`) before
   `ArticleMeta.parse`; T2's "slug equals the directory name" holds by construction.
9. **Keystatic reader `list()`/`all()` do NOT support a slug *suffix* path
   (`posts/*\/<lang>`)** — verified in the compiled `listCollection`: the `dataLocation:'outer'`
   branch only matches slug *files* directly under the base path, so our slug *directories*
   are dropped and it returns `[]`. `read(slug)` works (explicit path). FIX: enumerate slugs
   via the SAME GitHub trees API the reader uses internally (`listSlugs` in
   `lib/content/articles.ts`), then `read` each through the reader. DEC-1 intact (GitHub API
   at build, no clone). Without this the `[slug]` routes silently fell back to on-demand
   (broken on prod without a runtime token); now both locales prerender (SSG).
10. **Proxy matcher** (`proxy.ts`): added a second matcher entry re-including
   `/.../metadata.json`. The route handler lives under `[locale]`, but the broad dotted-path
   exclusion skipped the proxy, so the bare ES apex `/noticias/<slug>/metadata.json` 404'd
   (EN `/en/...` worked). The entry lets the proxy rewrite the apex → `/es/...`.
11. **`cover.src` → `MagazinePage` `coverSeed`** (placeholder picsum duotone). Real
   `next/image` covers + R2 are still deferred (DEC-6 partial → lands with T5/OG).
12. **`react-markdown`** added to render the MDX body as markdown (Phase-1 seeds are plain
   markdown). Full MDX → React *component* compilation (custom embedded components) is a
   later enhancement; not needed for Phase 1.
13. **Content package ships TS source** → `transpilePackages: ['@fruteroclub/content']` in
   `next.config.ts` (no build step in the content repo).
14. **`MagazineTabs` gained an OPTIONAL `ctaHrefBySlug`** (serializable; the homepage omits
   it → unchanged stub behaviour, `landing.test.tsx` still green). The `/noticias` index uses
   it to link cards to real routes. The HOMEPAGE #7 + hero-rail repoint to `latest()` is
   still T4 (untouched here, as scoped).
15. **Missing-locale safety:** CI guarantees bilingual, so a missing locale = unknown slug →
   `notFound()` (never a mixed-language fallback page — hard rule). The explicit sitemap-level
   noindex/drop net lands with the sitemap work (T5).

**Post-review hardening (adversarial review, 2 LOW findings — both applied):**
(a) `fetchTree` now throws if the GitHub tree response is `truncated` (latent >~100k-entry
corpus would otherwise drop pages — DEC-7); covered by a test. (b) The content-repo
`validate` script now rejects non-real calendar dates (e.g. `2026-06-31`, which would roll
over to `07-01` and skew `latest()`); `ArticleMeta`'s §5 regex is kept verbatim and the
semantic check lives at the CI gate. No critical/high findings.

## References (repo-relative)

- SEO factory + JSON-LD `@graph`: `lib/seo.ts` (`buildMetadata` `:164`, `siteJsonLd` `:120`, org id `:121`)
- Article view component to reuse: `components/marketing/MagazinePage.tsx`
- Lo último #7 + page-tabs: `components/marketing/LatestMagazine.tsx`, `components/marketing/MagazineTabs.tsx`
- Current stub data (field reference + seed source): `content/cards.ts:40`, `content/landing.ts` (`LATEST_POSTS`)
- i18n: `i18n/routing.ts` (`as-needed`), `i18n/navigation.ts` (`Link`), SEO locale map `lib/seo.ts:62`
- Route group + `force-static` example: `app/[locale]/(marketing)/page.tsx:48`
- Root OG route to clone: `app/opengraph-image.tsx`; sitemap: `app/sitemap.ts`
- Test conventions: `components/marketing/__tests__/landing.test.tsx`, `vitest.config.ts`
- Full eng-review record: `~/.gstack/projects/club-app/mel-main-design-20260622-112425.md`
```

> Build order: **T1 → T2 → T3 → (T4 ‖ T5 ‖ T6) → T7.** T1 gates everything; T4/T5/T6 touch
> different modules and can run in parallel worktrees after T3 lands.
