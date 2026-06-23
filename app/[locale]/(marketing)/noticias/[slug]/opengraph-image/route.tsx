import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

import { SITE_NAME } from '@/lib/seo'
import { getArticle, listSlugs, type Lang } from '@/lib/content/articles'
import { categoryLabel } from '@/lib/content/present'

/**
 * Per-article Open Graph card (T5 / DEC-9), served as a ROUTE HANDLER at the
 * STABLE path `/noticias/<slug>/opengraph-image`. We don't use the
 * `opengraph-image.tsx` file convention because Next serves that at a hashed,
 * unguessable path (`…/opengraph-image-<hash>`) — but the canonical OG URL must be
 * stable: it is hardcoded in `toErc721` (§5, the NFT `image` field) and wired into
 * the article metadata. A plain route handler gives us that exact, stable URL.
 *
 * PAPER register (warm cream, ink, magenta dot) + brand fonts, matching the site
 * card. One card per (locale × slug), prerendered at build (force-static).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-static'

export async function generateStaticParams() {
  const slugs = await listSlugs()
  return slugs.map((slug) => ({ slug }))
}

const SIZE = { width: 1200, height: 630 }
const PAPER = '#f9f5ef'
const INK = '#11091e'
const MAGENTA = '#c4088f'

const fontFile = (pkg: string, file: string) =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file))

const logoDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public', 'logo.png'),
).toString('base64')}`

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params
  const lang: Lang = locale === 'en' ? 'en' : 'es'

  // Prefer a designer-provided social card committed next to the post
  // (`cover-og.<ext>`, ideally 1200x630). It's the real SEO/AEO/social image and
  // also the JSON-LD + ERC-721 `image`. Fall back to the generated card below.
  for (const ext of ['jpg', 'png', 'webp']) {
    const url = `https://raw.githubusercontent.com/fruteroclub/content/main/posts/${slug}/cover-og.${ext}`
    const provided = await fetch(url)
    if (provided.ok) {
      return new Response(await provided.arrayBuffer(), {
        headers: {
          'content-type': provided.headers.get('content-type') ?? `image/${ext}`,
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    }
  }

  const article = await getArticle(slug, lang)

  const eyebrow = article ? categoryLabel(article.meta.category, lang) : 'Noticias'
  const title = article?.meta.title ?? SITE_NAME

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: PAPER,
          padding: '72px 80px',
          borderTop: `16px solid ${INK}`,
          fontFamily: 'Petrona',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Petrona',
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: MAGENTA,
          }}
        >
          {eyebrow}
        </div>

        {/* Headline — Bitter semibold (brand rule: headers are always 600) */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Bitter',
            fontWeight: 600,
            fontSize: 64,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            color: INK,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        {/* Brand lockup — logo + IBM Plex Mono wordmark + magenta dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={logoDataUri} width={56} height={56} alt="" />
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontFamily: 'IBM Plex Mono',
              fontWeight: 700,
              fontSize: 40,
              letterSpacing: -1,
              color: INK,
            }}
          >
            Frutero&nbsp;Club
            <span style={{ color: MAGENTA }}>.</span>
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [
        { name: 'Petrona', data: fontFile('petrona', 'petrona-latin-600-normal.woff'), weight: 600, style: 'normal' },
        { name: 'IBM Plex Mono', data: fontFile('ibm-plex-mono', 'ibm-plex-mono-latin-700-normal.woff'), weight: 700, style: 'normal' },
        { name: 'Bitter', data: fontFile('bitter', 'bitter-latin-600-normal.woff'), weight: 600, style: 'normal' },
      ],
    },
  )
}
