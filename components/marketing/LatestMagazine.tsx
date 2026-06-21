import { useTranslations } from "next-intl";

import { COMMUNITY_CARDS } from "@/content/cards";
import { SectionHeader } from "./SectionHeader";
import { MagazineTabs } from "./MagazineTabs";

/**
 * LatestMagazine (#7) — Lo último. The community's latest dispatches as a
 * josephroche.ie page-tabs reader (see DESIGN.md): inactive articles collapse to
 * vertical title spines; clicking one slides its full page open between them.
 * Light EDITORIAL beat (warm paper, FLAT, hairline + 2px ink rules); mounted in
 * the editorial column in page.tsx (NOT an arcade band).
 *
 * Source of truth: COMMUNITY_CARDS — the SAME dispatches the hero front-page rail
 * lists ("Lo que envió la comunidad"). The hero rail's "Ver todo →" scroll-links
 * to #lo-ultimo, so this is the full edition of those posts (one tab each).
 *
 * Layout: a newspaper nameplate (Bitter title + a mono edition strip framed by 2px
 * ink rules), then the <MagazineTabs> band. The tabs hold the client state; this
 * stays a server component and just hands down the localized CTA labels.
 *
 * Copy: card fields are literal ES (content/cards.ts) — paper-only public, ES-first.
 * The read CTA is a stub ("#") so each page shows latest.soon ("Pronto") until the
 * article backend ships.
 */
export function LatestMagazine() {
  const t = useTranslations("landing");

  return (
    <section id="lo-ultimo" className="scroll-mt-24 pb-20 md:pb-28">
      {/* Nameplate — section title */}
      <SectionHeader
        register="editorial"
        title={t("latest.heading")}
        rule={false}
        className="px-0 pb-4 pt-20 md:pt-28"
      />

      {/* Edition strip — masthead band (2px top rule; the tabs band caps the
          bottom), so the mono line reads as a newspaper nameplate. */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-ink py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-muted-2">
        <span>Edición 07 &middot; Lo que envió la comunidad</span>
        <span className="shrink-0">{COMMUNITY_CARDS.length} páginas</span>
      </div>

      {/* The page-tabs reader (client) */}
      <MagazineTabs
        posts={COMMUNITY_CARDS}
        readMore={t("latest.readMore")}
        soon={t("latest.soon")}
        brandLabel="Edición 07"
      />
    </section>
  );
}
