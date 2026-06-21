import { useTranslations } from "next-intl";

import { HISTORIC_RECORD, PLAYERS, RARITY } from "@/content/landing";
import {
  CharacterSelectBoard,
  type RosterEntry,
} from "./CharacterSelectBoard";

/**
 * CharacterSelect — #8 LEADERBOARD, the arcade character-select cabinet
 * (DESIGN.md §9; landing-sections-plan #8). Replaces the old `HighScoreCard`.
 *
 * The ONE marketing section that earns the full `[data-mode=arcade]` cabinet:
 * page.tsx mounts it inside `<ArcadeSection cabinet>`, so the gated shadow
 * utilities are LIVE here only. It's the arcade twin of Lo último's page-flip —
 * pick a builder from the roster (ranked by live $PULPA) and their card blooms
 * into the featured "page" (card art · rarity · $PULPA · CONSTRUYE ships ·
 * `Habla con su Agente →`).
 *
 * Server component: localizes the PLAYERS roster, sorts by $PULPA desc, and hands
 * the data to the <CharacterSelectBoard> client island (selection state).
 *
 * Reputation model: $PULPA (token, the rank key) + rarity (tier). NO levels/XP.
 * $PULPA is a SNAPSHOT until the onchain indexer (Envio) is live (plan: Infra
 * dependency). The `Habla con su Agente` CTA targets `/perfil/<id>`; that route +
 * the Agent feature are WIP (not yet available).
 */
export function CharacterSelect() {
  const t = useTranslations("landing");

  const roster: RosterEntry[] = PLAYERS.map((p) => ({
    id: p.id,
    name: p.name,
    acronym: p.acronym,
    role: t(p.roleKey),
    rarity: p.rarity,
    rarityName: t(`${RARITY[p.rarity].i18nKey}.name`),
    rarityRole: t(`${RARITY[p.rarity].i18nKey}.role`),
    pulpa: p.pulpa,
    ships: p.ships,
    accent: p.accent,
    href: `/perfil/${p.id}`,
  })).sort((a, b) => b.pulpa - a.pulpa);

  return (
    <section aria-label={t("leaderboard.title")}>
      <CharacterSelectBoard
        roster={roster}
        record={HISTORIC_RECORD}
        labels={{
          headerTitle: t("leaderboard.title"),
          headerTag: t("leaderboard.tag"),
          pulpaLabel: t("leaderboard.pulpaLabel"),
          weekLabel: t("leaderboard.weekLabel"),
          back: t("leaderboard.back"),
          prompt: t("leaderboard.prompt"),
          insert: t("leaderboard.insert"),
          highScore: t("leaderboard.highScore"),
          periodWeek: t("leaderboard.periods.week"),
          periodQuarter: t("leaderboard.periods.quarter"),
          periodYear: t("leaderboard.periods.year"),
          construye: t("leaderboard.construye"),
          agentCta: t("leaderboard.agentCta"),
          rosterTitle: t("leaderboard.rosterTitle"),
          footer: t("leaderboard.footer"),
        }}
      />
    </section>
  );
}
