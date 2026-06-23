import type { ArticleMeta } from '@fruteroclub/content'

import type { CommunityCardData } from '@/content/cards'
import type { MagazinePageProps } from '@/components/marketing/MagazinePage'

import type { Lang } from './articles'

/**
 * Pure mappers from the canonical `ArticleMeta` to the existing editorial
 * component shapes (`CommunityCardData` for the Lo último reader, `MagazinePageProps`
 * for the standalone article spread — DEC-14, reuse not redesign). No I/O, so these
 * are unit-tested directly.
 *
 * Level/XP copy is retired: the mono "stat" slot carries the author's verifiable
 * handle (`@handle`), not a level.
 */

type Category = ArticleMeta['category']

const CATEGORY_LABEL: Record<Lang, Record<Category, string>> = {
  es: { logro: 'Logro', evento: 'Evento', noticia: 'Noticia', guia: 'Guía', bitacora: 'Bitácora' },
  en: { logro: 'Achievement', evento: 'Event', noticia: 'News', guia: 'Guide', bitacora: 'Log' },
}

export function categoryLabel(category: Category, lang: Lang): string {
  return CATEGORY_LABEL[lang][category]
}

/** "YYYY-MM-DD" → compact uppercase edition date, e.g. "22 JUN 2026". UTC-fixed
 *  so the same input always formats identically regardless of build TZ. */
export function formatArticleDate(date: string, lang: Lang): string {
  const d = new Date(`${date}T00:00:00Z`)
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(d)
    .toUpperCase()
    .replace(/[.,]/g, '')
}

/** ArticleMeta → CommunityCardData (the Lo último / index reader card). */
export function toCard(meta: ArticleMeta, lang: Lang): CommunityCardData {
  return {
    id: meta.slug,
    category: categoryLabel(meta.category, lang),
    topic: meta.topic,
    accent: meta.accent,
    glyph: meta.glyph,
    collector: meta.collector,
    title: meta.title,
    dek: meta.dek,
    author: meta.author.name,
    time: formatArticleDate(meta.date, lang),
    stat: `@${meta.author.handle}`,
  }
}

/** ArticleMeta → MagazinePageProps for the standalone article header spread. The
 *  CTA points at the first source URL when present; otherwise the slot is empty
 *  (we are already on the article — no "read more" / "soon" affordance). */
export function toMagazinePageProps(
  meta: ArticleMeta,
  lang: Lang,
  sourceLabel: string,
): MagazinePageProps {
  const source = meta.sourceUrls[0]
  return {
    id: meta.slug,
    collector: meta.collector,
    category: categoryLabel(meta.category, lang),
    topic: meta.topic,
    glyph: meta.glyph,
    title: meta.title,
    dek: meta.dek,
    author: meta.author.name,
    time: formatArticleDate(meta.date, lang),
    stat: `@${meta.author.handle}`,
    accent: meta.accent,
    coverSeed: meta.cover.src,
    cta: source
      ? { label: sourceLabel, href: source }
      : { label: '', href: '#', soonLabel: '' },
    divider: false,
  }
}
