import { useTranslations } from "next-intl";

import { Glyph } from "@/components/Glyph";
import { COMMUNITY_CARDS } from "@/content/cards";
import type { CommunityCardData } from "@/content/cards";

import { ACCENT, duotone } from "./cardStyles";
import { Hero } from "./Hero";

/**
 * CommunityFrontPage — the single landing layout (IEEE Spectrum front page, see
 * DESIGN.md references). The LEAD column (left) carries the brand {@link Hero}
 * (h1 + subheadline + CTAs); the right column is "Lo que envió la comunidad" — a
 * hairline-divided list of the community's publications (news / events /
 * achievements), each a two-part eyebrow + Bitter headline + meta + duotone thumb.
 *
 * Line hierarchy: thin hairlines for the rail dividers + the vertical column rule;
 * a heavy 2px ink rule frames the bottom of the section. Flat, editorial, static.
 */

/** Two-part eyebrow: TYPE (muted) | TOPIC (accent) — the Spectrum pattern. */
function Eyebrow({ card }: { card: CommunityCardData }) {
  const a = ACCENT[card.accent];
  return (
    <div className="flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em]">
      <span className="flex items-center gap-1.5 text-muted-2">
        <Glyph name={card.glyph} size={11} /> {card.category}
      </span>
      <span className="h-3 w-px bg-line" aria-hidden="true" />
      <span className={a.stat}>{card.topic}</span>
    </div>
  );
}

function Meta({ card }: { card: CommunityCardData }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
      <span>{card.time}</span>
      <span className="h-3 w-px bg-line" aria-hidden="true" />
      <span>{card.author}</span>
      <span className="h-3 w-px bg-line" aria-hidden="true" />
      <span>{card.stat}</span>
    </div>
  );
}

function RailItem({ card, seed }: { card: CommunityCardData; seed: number }) {
  const a = ACCENT[card.accent];
  return (
    <li className="py-3.5 first:pt-0 md:pl-6">
      {/* Links to the matching page in #lo-ultimo — MagazineTabs opens that tab and
          scrolls the section into view (hash-driven; see MagazineTabs). */}
      <a
        href={`#${card.id}`}
        className="group flex items-start justify-between gap-4 no-underline"
      >
        <div className="min-w-0">
          <Eyebrow card={card} />
          <h3 className="mt-1.5 font-display text-lg font-semibold leading-[1.12] tracking-[-0.01em] text-ink transition-colors group-hover:text-magenta">
            {card.title}
          </h3>
          <div className="mt-1.5">
            <Meta card={card} />
          </div>
        </div>
        <span
          className="h-16 w-16 flex-none border border-line transition-colors group-hover:border-ink"
          style={duotone(a.varName, seed)}
          aria-hidden="true"
        />
      </a>
    </li>
  );
}

export function CommunityFrontPage() {
  const t = useTranslations("landing");

  return (
    <section className="grid gap-6 border-b-2 border-ink py-6 md:grid-cols-[1.7fr_1fr] md:gap-6 md:py-10">
      <Hero />

      {/* The horizontal item rules span the full column so they TOUCH the vertical
          column rule (connected hairline grid, Spectrum-style); the left padding
          lives on each item, not the wrapper. */}
      <div className="md:border-l md:border-line">
        <ul className="divide-y divide-line">
          {COMMUNITY_CARDS.map((card, i) => (
            <RailItem key={card.id} card={card} seed={i} />
          ))}
        </ul>

        {/* In-page link to the full magazine (#7 Lo último). Mono, hairline-topped,
            smooth-scrolls (html { scroll-behavior: smooth }). Plain anchor so it
            keeps this a static server component. */}
        <a
          href="#lo-ultimo"
          className="flex items-center gap-2 border-t border-line py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-magenta transition-colors hover:text-ink md:pl-6"
        >
          {t("community.viewAll")} <Glyph name="bolt" size={11} />
        </a>
      </div>
    </section>
  );
}
