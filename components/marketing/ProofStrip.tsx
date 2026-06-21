import { useTranslations } from "next-intl";

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
 * PLACEHOLDER DATA: all four PROOF_STATS carry TODO-swap values (see
 * content/landing.ts). When real operator numbers are ready, update the `value`
 * strings there — this component needs no change. The old `null`/"Pronto" flag
 * path is fully retired; all values are always strings.
 *
 * Server component — static.
 */
export function ProofStrip() {
  const t = useTranslations("landing");

  return (
    <section aria-label={t("proof.builders")} className="mt-10 pb-14 md:mt-14 md:pb-20">
      {/* Statement section: a full 2px-ink-FRAMED grid (2×2 mobile, 4-up desktop).
          Internal hairlines via a 1px gap on a `--line` bg; each stat centered h+v. */}
      <div className="grid grid-cols-2 gap-px border-2 border-ink bg-line md:grid-cols-4">
        {PROOF_STATS.map((stat) => (
          <div
            key={stat.i18nKey}
            className="flex flex-col items-center justify-center bg-paper px-5 py-8 text-center md:py-10"
          >
            {/* TODO-swap: replace placeholder value with real operator number */}
            <Stat value={stat.value} label={t(stat.i18nKey)} />
          </div>
        ))}
      </div>
    </section>
  );
}
