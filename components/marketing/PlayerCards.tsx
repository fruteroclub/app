import { useTranslations } from "next-intl";

import { PLAYERS, RARITY } from "@/content/landing";

import { SectionHeader } from "./SectionHeader";
import { PlayerCard } from "./PlayerCard";

/**
 * PlayerCards (#6 — the player-card deck). The trading-card mechanic (DESIGN.md)
 * as testimonial cards. Dark arcade band (inside <ArcadeSection id="testimonios">).
 *
 * Layout (2026-06-20): the deck is mounted inside an EXHIBITION FRAME (muted border
 * gallery mat) — the cards exhibited like a curated wall. An EVEN 3-col grid so the
 * rows align cleanly inside the frame (no brick offset overflowing it; the CSS-column
 * masonry was tried and reverted — it read messy). Mobile = 1 column. Data: PLAYERS.
 */

export function PlayerCards() {
  const t = useTranslations("landing");

  return (
    <div className="mx-auto max-w-[var(--wrap)] px-7 py-20 md:py-28">
      <SectionHeader
        register="arcade"
        title={t("testimonios.heading")}
        rule={false}
        className="mb-10"
      />

      {/* Exhibition frame — muted gallery mat around the even player-card grid. */}
      <div className="border-2 border-muted p-6 md:p-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLAYERS.map((p) => (
            <PlayerCard
              key={p.id}
              name={p.name}
              role={t(p.roleKey)}
              quote={t(`players.items.${p.id}.quote`)}
              rarity={p.rarity}
              rarityName={t(`${RARITY[p.rarity].i18nKey}.name`)}
              rarityRole={t(`${RARITY[p.rarity].i18nKey}.role`)}
              company={t(`players.items.${p.id}.company`)}
              city={t(`players.items.${p.id}.city`)}
              avatarSeed={p.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
