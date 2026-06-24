import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { latest, type Lang } from "@/lib/content/articles";
import { toCard } from "@/lib/content/present";
import {
  ArcadeSection,
  CharacterSelect,
  CommunityFrontPage,
  CtaBand,
  Faq,
  LatestMagazine,
  Masthead,
  Pillars,
  ProofStrip,
  SiteFooter,
  PlayerCards,
  Thesis,
  OpportunityMarketplace,
} from "@/components/marketing";

/**
 * Public landing — the 11-beat conversion publication (landing-sections plan).
 *
 * The page is a light/dark rhythm (L L D D L D L D* L D L). Editorial (paper)
 * sections live INSIDE the max-w editorial column; arcade (dark) sections are
 * FULL-BLEED via <ArcadeSection> (they escape the column and supply their own
 * inner max-w wrapper). The dark band #8 alone is a `cabinet` (data-mode=arcade →
 * shadows/HUD on); every other dark band stays FLAT (DESIGN.md Borders/Shadows).
 *
 * Hard rules honored: greenfield; vocab is "perfil" + "verificable" (never
 * onchain/crypto); the only island is the ContactForm on /enterprise — this page
 * is otherwise static. force-static SSG.
 *
 * Beat map (# · register · component):
 *   1 · paper  · CommunityFrontPage (hero + community rail) — done v0
 *   2 · paper  · ProofStrip (real proof numbers)
 *   3 · DARK   · Thesis (manifesto)            [ArcadeSection, flat]
 *   4 · DARK   · Pillars (Construye·Demuestra·Desbloquea) [ArcadeSection, flat]
 *   5 · paper  · OpportunityMarketplace (rarity-gated unlocks)
 *   6 · DARK   · Testimonials (voices)         [ArcadeSection, flat]
 *   7 · paper  · LatestMagazine (newspaper page stack)
 *   8 · DARK*  · CharacterSelect (leaderboard) [ArcadeSection cabinet → shadows on]
 *   9 · paper  · Faq (josephroche horizontal)
 *  10 · DARK   · CtaBand (recruitment door)    [ArcadeSection, flat]
 *  11 · paper  · SiteFooter
 */
export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  // T7: per-route metadata with self-canonical + es/en hreflang + OG/Twitter.
  return buildMetadata({
    locale: locale as Locale,
    path: "/",
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // T4: the news front-page rail (#1) + Lo último (#7) read the REAL latest
  // articles. Fetch the 6 once; the hero rail is the first 4 (same sort). The build
  // fails if the content read fails (DEC-7) — same source as /noticias.
  const lang: Lang = locale === "en" ? "en" : "es";
  const localePrefix = lang === "en" ? "/en" : "";
  const latestCards = (await latest(6, lang)).map((a) => toCard(a.meta, lang));
  const railCards = latestCards.slice(0, 4);

  return (
    <>
      {/* 11 · — · Masthead (persistent dark frame; header + brand + nav + CTA) */}
      <Masthead />

      <main>
        {/* Editorial column — PAPER beats #1, #2 live inside the max-w wrapper. */}
        <div className="mx-auto max-w-[var(--wrap)] px-7">
          {/* 1 · paper · Hero + community rail (rail deep-links into #lo-ultimo) */}
          <CommunityFrontPage posts={railCards} />
          {/* 2 · paper · Proof numbers */}
          <ProofStrip />
        </div>

        {/* 3 · DARK (flat) · Thesis manifesto — full-bleed */}
        <ArcadeSection id="thesis">
          <Thesis />
        </ArcadeSection>

        {/* 4 · DARK (flat) · Pillars / Cómo funciona — full-bleed */}
        <ArcadeSection id="como-funciona">
          <div className="mx-auto max-w-[var(--wrap)] px-7">
            <Pillars />
          </div>
        </ArcadeSection>

        {/* 5 · paper · Opportunity Marketplace (power-up board) — editorial column */}
        <div className="mx-auto max-w-[var(--wrap)] px-7">
          <OpportunityMarketplace />
        </div>

        {/* 6 · DARK (flat) · Player Cards (the trading-card deck) — full-bleed */}
        <ArcadeSection id="testimonios">
          <PlayerCards />
        </ArcadeSection>

        {/* 7 · paper · Lo último (newspaper page stack) — editorial column */}
        <div className="mx-auto max-w-[var(--wrap)] px-7">
          <LatestMagazine posts={latestCards} localePrefix={localePrefix} />
        </div>

        {/* 8 · DARK* · Leaderboard — full-bleed CABINET (data-mode=arcade → shadows on) */}
        <ArcadeSection id="leaderboard" cabinet>
          <div className="mx-auto max-w-[var(--wrap)] px-7 py-20 md:py-28">
            <CharacterSelect />
          </div>
        </ArcadeSection>

        {/* 9 · paper · FAQ (josephroche horizontal) — editorial column */}
        <div className="mx-auto max-w-[var(--wrap)] px-7">
          <Faq />
        </div>

        {/* 10 · DARK (flat) · CTA band — full-bleed recruitment door */}
        <ArcadeSection id="cta">
          <CtaBand />
        </ArcadeSection>
      </main>

      {/* 11 · paper · Footer */}
      <SiteFooter />
    </>
  );
}
