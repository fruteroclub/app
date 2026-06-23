import { toErc721 } from '@fruteroclub/content'

import { SITE_URL } from '@/lib/seo'
import { getArticle, listSlugs, type Lang } from '@/lib/content/articles'

/**
 * GET /noticias/[slug]/metadata.json — article-only ERC-721 metadata (DEC-3),
 * served by a route handler (NOT a file in public/). `properties{}` is minimal
 * (`slug`, `source_urls`). force-static: built per (locale × slug) at build time.
 */
export const dynamic = 'force-static'

export async function generateStaticParams() {
  const slugs = await listSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params
  const lang: Lang = locale === 'en' ? 'en' : 'es'

  const article = await getArticle(slug, lang)
  if (!article) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  return Response.json(toErc721(article.meta, SITE_URL))
}
