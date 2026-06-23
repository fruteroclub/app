import { getTranslations, setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import type { Metadata } from 'next'

import { buildMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n/routing'
import { Glyph } from '@/components/Glyph'
import { Card } from '@/components/ui'
import {
  Masthead,
  SectionHeading,
  SiteFooter,
} from '@/components/marketing'
import { ContactForm } from '@/components/marketing/ContactForm'
import {
  CONTACT_ANCHOR,
  ENTERPRISE_SERVICES,
} from '@/content/enterprise'

/**
 * /enterprise — the services-led lead-capture page (T6).
 *
 * GTM (plan, APPROVED): leads with PROVEN SERVICES (the credible front
 * door), then a softer "verified talent / recruiting" block — recruiting is
 * "talk to us", gated behind the single ContactForm rather than a self-serve
 * flow. The ContactForm is the ONLY interactive island; everything else is
 * static SSG.
 *
 * Hard rules honored: greenfield; PAPER-ONLY public (no MODO toggle — the
 * Masthead/SiteFooter are the paper-only landing primitives); vocab is "perfil"
 * + "verificable" (never onchain/crypto); leads persist to the `leads` table via
 * /api/contact (DB = system of record). force-static (the island hydrates).
 */
export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'enterprise' })
  // T7: per-route metadata with self-canonical + es/en hreflang + OG/Twitter.
  return buildMetadata({
    locale: locale as Locale,
    path: '/enterprise',
    title: t('meta.title'),
    description: t('meta.description'),
  })
}

export default async function EnterprisePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Masthead />

      <main>
        <div className="mx-auto max-w-[var(--wrap)] px-7">
          <EnterpriseHero />
          <Services />
          <TalentBlock />
          <ContactSection />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}

/** Hero — services-led headline + lead, CTA scrolls to the contact form. */
function EnterpriseHero() {
  const t = useTranslations('enterprise')
  return (
    <section className="grid items-center gap-12 py-[60px] md:grid-cols-[1.3fr_0.7fr]">
      <div>
        <div className="mb-[22px] flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
          <Glyph name="target" size={13} />
          {t('hero.kicker')}
          <span className="h-px max-w-[120px] flex-1 bg-line" />
        </div>
        <h1 className="font-display text-[56px] font-semibold leading-[0.94] tracking-[-0.03em] md:text-[68px]">
          {t('hero.title')}
          <span className="text-magenta">.</span>
        </h1>
        <p className="mt-6 max-w-[46ch] font-serif text-xl leading-[1.4] text-ink">
          {t('hero.lead')}
        </p>
        <div className="mt-7">
          <a
            href={`#${CONTACT_ANCHOR}`}
            className="inline-flex items-center gap-[9px] border-2 border-black bg-magenta px-[26px] py-[15px] font-mono text-sm font-semibold uppercase tracking-[0.07em] text-white no-underline transition-colors duration-[80ms] hover:bg-[color-mix(in_srgb,var(--magenta)_88%,var(--black))]"
          >
            <Glyph name="bolt" size={14} />
            {t('hero.cta')}
          </a>
        </div>
      </div>
      <Card variant="hard" className="p-6">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-2">
          {t('hero.cardLabel')}
        </div>
        <p className="font-serif text-lg leading-[1.45] text-ink">
          {t('hero.cardBody')}
        </p>
      </Card>
    </section>
  )
}

/** Proven services — the lead. Three offering cards. */
function Services() {
  const t = useTranslations('enterprise')
  return (
    <section className="border-t border-line py-14">
      <SectionHeading glyph="grid" glyphColor="var(--magenta)" tag={t('services.tag')}>
        {t('services.heading')}
      </SectionHeading>
      <div className="grid gap-6 md:grid-cols-3">
        {ENTERPRISE_SERVICES.map((service) => (
          <Card
            key={service.i18nKey}
            variant="hard"
            accent={service.accent}
            className="p-6 pt-7"
          >
            <Glyph
              name={service.glyph}
              size={22}
              style={{ color: `var(--${service.accent})` }}
            />
            <h3 className="mt-4 font-display text-2xl font-bold leading-tight tracking-[-0.01em]">
              {t(`services.${service.i18nKey}.title`)}
            </h3>
            <p className="mt-2.5 font-sans text-sm leading-[1.5] text-muted">
              {t(`services.${service.i18nKey}.body`)}
            </p>
          </Card>
        ))}
      </div>
    </section>
  )
}

/** Verified-talent / recruiting block — softer, gated to "talk to us". */
function TalentBlock() {
  const t = useTranslations('enterprise')
  return (
    <section className="border-t border-line py-14">
      <SectionHeading glyph="star" glyphColor="var(--orange)" tag={t('talent.tag')}>
        {t('talent.heading')}
      </SectionHeading>
      <div className="grid items-start gap-8 md:grid-cols-[1fr_1fr]">
        <p className="font-serif text-xl leading-[1.45] text-ink">
          {t('talent.lead')}
        </p>
        <Card variant="hair" className="p-6">
          <p className="font-sans text-sm leading-[1.55] text-muted">
            {t('talent.body')}
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
            {t('talent.gated')}
          </p>
        </Card>
      </div>
    </section>
  )
}

/** The single ContactForm island — the only interactive element on the page. */
function ContactSection() {
  const t = useTranslations('enterprise')
  return (
    <section
      id={CONTACT_ANCHOR}
      className="scroll-mt-8 border-t border-line py-14"
    >
      <SectionHeading glyph="target" tag={t('contact.tag')}>
        {t('contact.heading')}
      </SectionHeading>
      <p className="mb-8 max-w-[52ch] font-serif text-lg leading-[1.45] text-muted">
        {t('contact.lead')}
      </p>
      <ContactForm source="enterprise" />
    </section>
  )
}
