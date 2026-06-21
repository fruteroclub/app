import { useTranslations } from "next-intl";

import { UNLOCKS } from "@/content/landing";
import type { AccentColor } from "@/content/landing";

import { SectionHeader } from "./SectionHeader";
import { LevelLadder } from "./LevelLadder";
import type { LevelTier, LevelTierAccent } from "./LevelLadder";
import { UnlockCard } from "./UnlockCard";

/**
 * Unlocks — #5 "Lo que desbloqueas" (light, editorial paper, FLAT).
 *
 * SPEC: prize-poster layout in two beats:
 *   1. LevelLadder (01→10) — pinned unlock tiers (05 magenta, 08 green) make
 *      "sube de nivel = puertas reales" scannable at a glance.
 *   2. Two UnlockCard prize-poster cards below the ladder they map to.
 *
 * DESIGN: editorial (warm paper), FLAT (no shadows — this is NOT an arcade section).
 * Square corners; hairlines; Bitter headers / Geist body / IBM Plex Mono indices.
 *
 * Server component — static (no client hooks).
 *
 * Data: UNLOCKS from content/landing.ts (2 entries: level "05", "08").
 * i18n:  keys resolved via useTranslations("landing"); see messages/{es,en}/landing.json.
 *
 * Local fallback:
 *   - Ladder eyebrow "Sube de nivel →" is hardcoded mono (ES primary). The key
 *     `unlocks.ladder` is absent from the foundation contract's message files. Add
 *     it to both locales + update messages.test.ts if localization is needed.
 *   - Level tier short labels are derived from `${i18nKey}.title` (the same key
 *     used by the card title), which IS present in messages.
 */

/** Map AccentColor → LevelTierAccent (same set, typed separately for reuse safety). */
function toTierAccent(a: AccentColor): LevelTierAccent {
  return a as LevelTierAccent;
}

/** Structural accent map for the two pinned tiers. */
const TIER_ACCENT: Record<string, AccentColor> = {
  "05": "magenta",
  "08": "green",
};

export function Unlocks() {
  const t = useTranslations("landing");

  // Build the pinned tier config for LevelLadder from UNLOCKS data.
  const ladderTiers: LevelTier[] = UNLOCKS.map((u) => ({
    level: u.level,
    accent: toTierAccent(TIER_ACCENT[u.level] ?? "magenta"),
    // Short label pinned under the tier tick = the card title (already localized).
    label: t(`${u.i18nKey}.title`),
  }));

  return (
    <section id="desbloquea" className="border-t border-line py-14">
      {/* Section header — clean big title */}
      <SectionHeader
        register="editorial"
        title={t("unlocks.heading")}
        rule={false}
        className="mb-10"
      />

      {/* ── Beat 1: Level Ladder ─────────────────────────────────────────────── */}
      <LevelLadder
        totalLevels={10}
        tiers={ladderTiers}
        eyebrow="Sube de nivel →"
        className="mb-12"
      />

      {/* ── Beat 2: Unlock cards (prize posters) ─────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {UNLOCKS.map((unlock) => {
          const accent: AccentColor = TIER_ACCENT[unlock.level] ?? "magenta";
          return (
            <UnlockCard
              key={unlock.i18nKey}
              accent={accent}
              level={unlock.level}
              tierLabel={t("unlocks.tier", { level: unlock.level })}
              title={t(`${unlock.i18nKey}.title`)}
              body={t(`${unlock.i18nKey}.body`)}
              meta={t(`${unlock.i18nKey}.meta`)}
            />
          );
        })}
      </div>
    </section>
  );
}
