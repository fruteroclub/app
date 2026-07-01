"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

import { api } from "@/convex/_generated/api";
import { PROOF_STATS } from "@/content/landing";

import { Stat } from "./Stat";

/**
 * ProofStrip (#2) — editorial, light paper. A thin credibility band immediately
 * under the hero: 4 proof stats rendered as a quiet mono masthead-dateline row.
 *
 * DESIGN:
 *   - 2 px ink top rule (the DESIGN.md "5 px masthead / 2 px section top" hierarchy).
 *   - Four equal columns; columns separated by a 1 px `--line` hairline.
 *   - Uses the reusable <Stat> with the default 'lg' size and no accent bar —
 *     the strip reads as the publication's dateline, NOT a SaaS metric wall.
 *   - Flat (no shadows, no dark bg). Editorial paper surface only.
 *   - Responsive: scrolls horizontally on mobile (no wrap) to preserve the
 *     dateline proportion; columns shrink gracefully at md+.
 *
 * Launch stats:
 *   - builders/projects come from Convex.
 *   - events/opportunities are launch constants returned by the same query.
 */
export function ProofStrip() {
  const t = useTranslations("landing");
  const launchStats = useQuery(api.clubApp.getLaunchStats) as
    | LaunchStats
    | undefined;

  return (
    <section
      aria-label={t("proof.builders")}
      className="mt-10 pb-14 md:mt-14 md:pb-20"
    >
      {/* Statement section: a full 2px-ink-FRAMED grid (2×2 mobile, 4-up desktop).
          Internal hairlines via a 1px gap on a `--line` bg; each stat centered h+v. */}
      <div className="grid grid-cols-2 gap-px border-2 border-ink bg-line md:grid-cols-4">
        {PROOF_STATS.map((stat) => (
          <div
            key={stat.i18nKey}
            className="flex flex-col items-center justify-center bg-paper px-5 py-8 text-center md:py-10"
          >
            <Stat
              value={getStatValue(stat, launchStats)}
              label={t(stat.i18nKey)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

interface LaunchStats {
  activeBuilders: number;
  projects: number;
  events: number;
  opportunities: number;
}

type ProofStat = (typeof PROOF_STATS)[number];

function getStatValue(
  stat: ProofStat,
  launchStats: LaunchStats | undefined,
): string {
  if (!launchStats) return stat.value ?? "—";

  switch (stat.i18nKey) {
    case "proof.builders":
      return formatCount(launchStats.activeBuilders);
    case "proof.projects":
      return formatCount(launchStats.projects);
    case "proof.events":
      return `${formatCount(launchStats.events)}+`;
    case "proof.unlocks":
      return formatCount(launchStats.opportunities);
    default:
      return stat.value ?? "—";
  }
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
