import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { buildMetadata } from '@/lib/seo'
import { latest, type Lang } from '@/lib/content/articles'
import { toCard } from '@/lib/content/present'
import { Masthead, SectionHeader, SiteFooter } from '@/components/marketing'
import { MagazineTabs } from '@/components/marketing/MagazineTabs'

/**
 * /noticias — the news index (DEC-4, DEC-14). Reuses the Lo último layout
 * (nameplate + edition strip + the MagazineTabs page-flip reader) fed with the
 * latest real articles; each card's read CTA links to its /noticias/<slug> route.
 * Zero posts → the "pronto" empty state. force-static (read at build, DEC-1).
 */
export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'noticias' })
  return buildMetadata({
    locale: locale as Locale,
    path: '/noticias',
    title: t('meta.title'),
    description: t('meta.description'),
  })
}

export default async function NoticiasIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const lang: Lang = locale === 'en' ? 'en' : 'es'

  const articles = await latest(6, lang)
  const t = await getTranslations({ locale, namespace: 'noticias' })

  const cards = articles.map((a) => toCard(a.meta, lang))
  // Locale-prefixed (as-needed) article hrefs for the read CTA. MagazineTabs
  // renders a plain <a>, so the prefix must be baked in here.
  const prefix = lang === 'en' ? '/en' : ''
  const ctaHrefBySlug = Object.fromEntries(
    articles.map((a) => [a.meta.slug, `${prefix}/noticias/${a.meta.slug}`]),
  )

  return (
    <>
      <Masthead />
      <main className="mx-auto w-full max-w-[var(--wrap)] px-5 md:px-7">
        <SectionHeader
          register="editorial"
          title={t('heading')}
          rule={false}
          className="px-0 pb-4 pt-16 md:pt-24"
        />
        <div className="flex items-center justify-between gap-4 border-t-2 border-ink py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-muted-2">
          <span>{t('edition')}</span>
          <span className="shrink-0">{t('count', { count: cards.length })}</span>
        </div>

        {cards.length === 0 ? (
          <div className="border-t-2 border-ink py-24 text-center font-serif text-lg text-muted">
            {t('empty')}
          </div>
        ) : (
          <MagazineTabs
            posts={cards}
            readMore={t('readMore')}
            soon={t('soon')}
            brandLabel={t('heading')}
            ctaHrefBySlug={ctaHrefBySlug}
          />
        )}

        <div className="pb-20 md:pb-28" />
      </main>
      <SiteFooter />
    </>
  )
}
