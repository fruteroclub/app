import { useTranslations } from "next-intl";

import { HISTORIC_RECORD, PLAYERS } from "@/content/landing";
import { CharacterSelectBoard, type RosterEntry } from "./CharacterSelectBoard";

/**
 * CharacterSelect — #8 $PULPA preview, the locked arcade character-select cabinet.
 *
 * We do not have real builders, balances, rankings, or distribution yet. The
 * cabinet therefore renders the future slots as hidden characters: abstract
 * portraits, "???", and "--" instead of mock people or fake $PULPA numbers.
 */
export function CharacterSelect() {
  const t = useTranslations("landing");

  const roster: RosterEntry[] = PLAYERS.map((p) => ({
    id: p.id,
    name: "???",
    acronym: "???",
    role: t("leaderboard.hiddenRole"),
    rarity: p.rarity,
    rarityName: t("leaderboard.lockedTier"),
    rarityRole: t("leaderboard.hiddenRole"),
    pulpa: null,
    ships: [t("leaderboard.hiddenShip")],
    accent: p.accent,
    locked: true,
  }));

  return (
    <section aria-label={t("leaderboard.title")}>
      <CharacterSelectBoard
        roster={roster}
        record={{
          acronym: "???",
          rarity: HISTORIC_RECORD.rarity,
          pulpa: null,
        }}
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
          hiddenSlot: t("leaderboard.hiddenSlot"),
        }}
      />
    </section>
  );
}
