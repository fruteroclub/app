import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

/**
 * AppMasthead — the member-area header for the authed (app) group.
 *
 * The same publication-frame ink bar as the marketing Masthead (logo + IBM Plex
 * Mono wordmark + magenta signature dot), minus the marketing nav/CTA — inside
 * the app you're already past the front door. The bottom black border seats it on
 * the arcade-dark surface like the top edge of an arcade cabinet. Server component.
 */
export function AppMasthead() {
  const t = useTranslations('app')
  const tc = useTranslations('common')

  return (
    // The publication-frame ink bar (same as the marketing Masthead): a dark bar
    // on the warm-paper app. text-white is mode-agnostic (avoids the --paper
    // inversion gotcha if a child opts into arcade locally).
    <header className="sticky top-0 z-50 bg-frame text-white">
      <div className="mx-auto flex h-16 max-w-[var(--wrap)] items-center justify-between gap-6 px-7">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image
            src="/logo.png"
            width={32}
            height={32}
            alt=""
            priority
            className="flex-none"
          />
          <span className="font-mono text-lg font-bold leading-none tracking-[-0.01em]">
            <span className="text-white">{tc('brand.name')}</span>
            <span className="text-magenta">.</span>
          </span>
        </Link>
        <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-magenta">
          <span aria-hidden>▸</span>
          {t('memberArea')}
        </span>
      </div>
    </header>
  )
}
