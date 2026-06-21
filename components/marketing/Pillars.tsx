import { useTranslations } from "next-intl";

import { PILLARS } from "@/content/landing";
import { SectionHeader } from "./SectionHeader";
import { StatementCard } from "./StatementCard";

/**
 * Pillars (#4 — "Cómo funciona / El ciclo"): Construye · Demuestra · Desbloquea.
 *
 * DARK register / FLAT (no shadows). Mounted inside
 *   <ArcadeSection id="como-funciona">
 *     <div className="mx-auto max-w-[var(--wrap)] px-7">
 *       <Pillars />
 *     </div>
 *   </ArcadeSection>
 * in page.tsx. The ArcadeSection wrapper owns the full-bleed dark bg + the
 * --paper/--ink/--card/--line/--muted/--muted-2 token remap to their --arcade-*
 * counterparts. Inside this component:
 *   - `bg-paper` on each card → arcade deep bg (--arcade-bg)
 *   - `text-ink` body → arcade off-white fg (--arcade-fg)
 *   - `border-line` hairlines → --arcade-line
 *   - `text-muted-2` labels → --arcade-muted-2
 *   - `text-white` (SectionHeader register="arcade") → true white for the heading
 *   - accent colors (magenta/green/orange) → at FULL power (no remap needed)
 *
 * Layout: a flush, hairline-bordered grid of three StatementCard "poster" columns.
 * Step 3 (Desbloquea, index "03") gets concrete "real doors" callouts to sharpen
 * the unlock message (plan: "sharpen step 3 to point at real doors").
 *
 * Server component. Static.
 *
 * METHODOLOGY: the per-pillar card is extracted into <StatementCard> (standalone,
 * prop-driven, no hardcoded content) — reusable on any other page or surface.
 */

/** Concrete "real doors" callouts for step 3 (Desbloquea). */
const UNLOCK_DOORS = [
  "Demo Slots CDMX",
  "Estadía 1 semana",
] as const;

export function Pillars() {
  const t = useTranslations("landing");

  return (
    <div className="py-20 md:py-28">
      {/* Section header — clean big title (no badge; "el ciclo" would just restate it) */}
      <SectionHeader
        register="arcade"
        title={t("pillars.heading")}
        rule={false}
        className="mb-10"
      />

      {/*
        Poster cards grid — 3 equal columns on md+, single column on mobile.
        Each card carries its own bold accent border, so they sit apart with a
        real gap (not a flush hairline grid that vanishes on the dark band).
      */}
      <div className="grid gap-5 md:grid-cols-3">
        {PILLARS.map((pillar) => {
          const isUnlock = pillar.index === "03";

          return (
            <StatementCard
              key={pillar.index}
              index={pillar.index}
              glyph={pillar.glyph}
              accent={pillar.accent}
              title={t(`${pillar.i18nKey}.title`)}
              body={t(`${pillar.i18nKey}.body`)}
              callouts={isUnlock ? UNLOCK_DOORS : undefined}
              calloutsLabel={isUnlock ? "Puertas reales" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
