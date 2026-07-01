import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { Glyph } from "@/components/Glyph";
import { Button, Card } from "@/components/ui";
import {
  ArcadeSection,
  Band,
  Masthead,
  SectionHeading,
  SiteFooter,
  ThesisFrame,
} from "@/components/marketing";
import { ContactForm } from "@/components/marketing/ContactForm";
import { CONTACT_ANCHOR, ENTERPRISE_SERVICES } from "@/content/enterprise";

/**
 * /enterprise — the services-led lead-capture page (T6).
 *
 * GTM (plan, APPROVED): leads with PROVEN SERVICES (the credible front
 * door), then a softer "verified talent / recruiting" block — recruiting is
 * "talk to us", gated behind ContactForm rather than a self-serve flow.
 *
 * Hard rules honored: greenfield; PAPER-ONLY public (no MODO toggle — the
 * Masthead/SiteFooter are the paper-only landing primitives); vocab is "perfil"
 * + "verificable" (never onchain/crypto); leads persist to Convex first.
 */
export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enterprise" });
  // T7: per-route metadata with self-canonical + es/en hreflang + OG/Twitter.
  return buildMetadata({
    locale: locale as Locale,
    path: "/enterprise",
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function EnterprisePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Masthead />

      <main className="scroll-mt-20">
        <div className="mx-auto max-w-[var(--wrap)] px-7">
          <EnterpriseHero />
        </div>

        <ArcadeSection id="que-es-frutero">
          <EnterpriseManifesto />
        </ArcadeSection>

        <div className="mx-auto max-w-[var(--wrap)] px-7">
          <Services />
          <TalentBlock />
        </div>
        <ContactSection />
      </main>

      <SiteFooter />
    </>
  );
}

/** Hero — services-led headline, CTA scrolls to the contact form. */
function EnterpriseHero() {
  const t = useTranslations("enterprise");
  const dot = (chunks: ReactNode) => (
    <span className="text-magenta">{chunks}</span>
  );
  const line = (chunks: ReactNode) => <span className="block">{chunks}</span>;

  return (
    <section className="grid min-h-[calc(100svh-14rem)] place-items-center py-16 text-center md:min-h-[calc(100svh-15rem)] md:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mx-auto mb-6 flex max-w-xl items-center justify-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
          <Glyph name="target" size={13} />
          {t("hero.kicker")}
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-[clamp(3.6rem,7vw,5.75rem)] font-semibold leading-[0.96] tracking-[-0.03em]">
          {t("hero.title")}
          <span className="text-magenta">.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-serif text-xl leading-[1.4] text-ink md:text-2xl">
          {t.rich("hero.subhead", { dot, line })}
        </p>
        <div className="mx-auto mt-8 flex max-w-2xl justify-end">
          <Button asChild size="lg">
            <a href={`#${CONTACT_ANCHOR}`}>
              <Glyph name="bolt" size={16} />
              {t("hero.cta")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Dark manifesto twin of the landing thesis section. */
function EnterpriseManifesto() {
  const t = useTranslations("enterprise");

  return (
    <ThesisFrame
      tag={t("about.tag")}
      heading={
        <>
          {t("about.heading")}
          <span className="text-magenta">.</span>
        </>
      }
      body={t("about.body")}
      bridgeUp={t("about.bridgeUp")}
      bridgeReward={t("about.bridgeReward")}
    />
  );
}

/** Proven services — the lead. Three offering cards. */
function Services() {
  const t = useTranslations("enterprise");
  return (
    <section className="border-t border-line py-14">
      <SectionHeading
        glyph="grid"
        glyphColor="var(--magenta)"
        tag={t("services.tag")}
      >
        {t("services.heading")}
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
            <h3 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-[-0.01em]">
              {t(`services.${service.i18nKey}.title`)}
            </h3>
            <p className="mt-2.5 font-sans text-sm leading-[1.5] text-muted">
              {t(`services.${service.i18nKey}.body`)}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** Verified-talent / recruiting block — softer, gated to "talk to us". */
function TalentBlock() {
  const t = useTranslations("enterprise");
  return (
    <section className="border-t border-line py-14">
      <SectionHeading
        glyph="star"
        glyphColor="var(--orange)"
        tag={t("talent.tag")}
      >
        {t("talent.heading")}
      </SectionHeading>
      <div className="grid items-start gap-8 md:grid-cols-[1fr_1fr]">
        <p className="font-serif text-xl leading-[1.45] text-ink">
          {t("talent.lead")}
        </p>
        <Card variant="hair" className="p-6">
          <p className="font-sans text-sm leading-[1.55] text-muted">
            {t("talent.body")}
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
            {t("talent.gated")}
          </p>
        </Card>
      </div>
    </section>
  );
}

/** Lead-capture section. */
function ContactSection() {
  const t = useTranslations("enterprise");
  return (
    <ArcadeSection id={CONTACT_ANCHOR} className="scroll-mt-0">
      <Band py="py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-2">
            <span className="h-px w-12 bg-line" aria-hidden="true" />
            <Glyph
              name="target"
              size={13}
              style={{ color: "var(--magenta)" }}
            />
            {t("contact.tag")}
            <span className="h-px w-12 bg-line" aria-hidden="true" />
          </div>
          <h2 className="font-display text-5xl font-semibold leading-none tracking-[-0.03em] text-white md:text-6xl">
            {t("contact.heading")}
            <span className="text-magenta" aria-hidden>
              .
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] font-serif text-xl leading-[1.5] text-ink">
            {t("contact.lead")}
          </p>
        </div>

        <div className="mt-10">
          <ContactForm source="enterprise" />
        </div>
      </Band>
    </ArcadeSection>
  );
}
