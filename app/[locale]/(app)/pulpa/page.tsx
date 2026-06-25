import { setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'

import { GlyphDefs, Glyph } from '@/components/Glyph'
import { Button } from '@/components/ui'
import { Link } from '@/i18n/navigation'

/**
 * /pulpa — the in-app $PULPA roadmap explainer (v1.0). $PULPA stays VISIBLE
 * across the app as the direction the club is heading, but the live scoring
 * system lands in v1.1; this page explains what it is and when it arrives,
 * including the first distribution (the Q3 2026 membership). Public + static —
 * exempt from the (app) AuthGuard so anyone can read it.
 */
export const dynamic = 'force-static'

export default async function PulpaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-7 py-14">
      <GlyphDefs />
      <PulpaContent />
    </main>
  )
}

const MILESTONES = ['now', 'q3', 'next'] as const

function PulpaContent() {
  const t = useTranslations('pulpa')

  return (
    <article className="grid gap-10">
      <header className="grid max-w-[60ch] gap-4">
        <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.03em] text-ink md:text-6xl">
          <span className="text-magenta">$</span>
          {t('title')}
        </h1>
        <p className="font-serif text-xl leading-[1.45] text-ink">{t('lead')}</p>
      </header>

      <section className="grid max-w-[60ch] gap-3 border-t-2 border-ink pt-6">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-2">
          {t('what.heading')}
        </h2>
        <p className="font-sans text-lg leading-[1.5] text-muted">{t('what.body')}</p>
      </section>

      <section className="grid gap-5">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-2">
          {t('roadmap.heading')}
        </h2>
        <ol className="grid gap-4">
          {MILESTONES.map((m) => (
            <li
              key={m}
              className="border-[3px] border-frame bg-surface p-6 md:grid md:grid-cols-[200px_1fr] md:gap-6"
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-magenta">
                {t(`roadmap.${m}.tag`)}
              </span>
              <div className="mt-2 md:mt-0">
                <h3 className="font-display text-xl font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
                  {t(`roadmap.${m}.title`)}
                </h3>
                <p className="mt-1.5 font-sans text-base leading-[1.5] text-muted">
                  {t(`roadmap.${m}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA that OPENS a flow → left-aligned with the copy (DESIGN.md). */}
      <div>
        <Button asChild>
          <Link href="/dashboard">
            <Glyph name="bolt" size={14} />
            {t('cta')}
          </Link>
        </Button>
      </div>
    </article>
  )
}
