import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import ReactMarkdown from 'react-markdown'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { buildMetadata, articleJsonLd, localizedUrl } from '@/lib/seo'
import { getArticle, listSlugs, type Lang } from '@/lib/content/articles'
import { toMagazinePageProps } from '@/lib/content/present'
import { MagazinePage, Masthead, SiteFooter } from '@/components/marketing'
import { JsonLd } from '@/components/seo/JsonLd'

/**
 * /noticias/[slug] — a single article (DEC-4, DEC-14).
 *
 * UI reuses `MagazinePage` (the Lo último spread) standalone as the article header
 * + a back-link to /noticias, then the rendered body below. force-static; the post
 * is read from `fruteroclub/content` at BUILD via the GitHub reader (DEC-1/DEC-7).
 * `generateStaticParams` emits every slug; the parent `[locale]` segment supplies
 * both locales, so each (locale × slug) prerenders.
 *
 * Bilingual is guaranteed by content-repo CI, so a missing locale means an unknown
 * slug → `notFound()` (never a mixed-language fallback page — hard rule). The
 * sitemap-level noindex/drop safety net lands with the sitemap work (T5).
 */
export const dynamic = 'force-static'

export async function generateStaticParams() {
  const slugs = await listSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const lang: Lang = locale === 'en' ? 'en' : 'es'
  const article = await getArticle(slug, lang)
  if (!article) {
    return buildMetadata({
      locale: locale as Locale,
      path: `/noticias/${slug}`,
      title: 'Noticias',
      description: '',
      index: false,
    })
  }
  return buildMetadata({
    locale: locale as Locale,
    path: `/noticias/${slug}`,
    title: article.meta.title,
    description: article.meta.dek ?? article.meta.title,
    // DEC-9: wire the per-route OG card explicitly (the file convention does not
    // cascade through [locale]).
    image: {
      url: localizedUrl(locale as Locale, `/noticias/${slug}/opengraph-image`),
      alt: article.meta.cover.alt,
    },
  })
}

// Markdown → editorial paper styling (no Tailwind typography plugin in this repo).
const markdownComponents = {
  p: (props: { children?: React.ReactNode }) => (
    <p className="mt-5 font-serif text-lg leading-relaxed text-ink" {...props} />
  ),
  strong: (props: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-ink" {...props} />
  ),
  a: (props: { href?: string; children?: React.ReactNode }) => (
    <a
      className="text-magenta underline underline-offset-2"
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    />
  ),
  ul: (props: { children?: React.ReactNode }) => (
    <ul className="mt-5 list-disc space-y-2 pl-6 font-serif text-lg leading-relaxed text-ink" {...props} />
  ),
  h2: (props: { children?: React.ReactNode }) => (
    <h2 className="mt-10 font-display text-2xl font-semibold text-ink" {...props} />
  ),
}

export default async function NoticiaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const lang: Lang = locale === 'en' ? 'en' : 'es'

  const article = await getArticle(slug, lang)
  if (!article) notFound()

  const t = await getTranslations({ locale, namespace: 'noticias' })

  return (
    <>
      <JsonLd
        data={articleJsonLd(locale as Locale, {
          title: article.meta.title,
          dek: article.meta.dek,
          date: article.meta.date,
          author: article.meta.author,
          url: localizedUrl(locale as Locale, `/noticias/${slug}`),
          image: localizedUrl(locale as Locale, `/noticias/${slug}/opengraph-image`),
        })}
      />
      <Masthead />
      <main className="mx-auto w-full max-w-4xl px-5 py-12 md:px-8 md:py-16">
        <Link
          href="/noticias"
          className="font-mono text-xs uppercase tracking-[0.14em] text-muted-2 hover:text-ink"
        >
          {t('back')}
        </Link>

        <div className="mt-6">
          <MagazinePage {...toMagazinePageProps(article.meta, lang, t('source'))} />
        </div>

        <div className="mx-auto mt-2 max-w-prose border-t-2 border-ink pt-8">
          <ReactMarkdown components={markdownComponents}>{article.body}</ReactMarkdown>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
