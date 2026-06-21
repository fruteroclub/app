import type { CSSProperties, ReactNode } from "react";

/**
 * ArcadeSection — the shared full-bleed DARK band for the marketing landing
 * (beats #3 Thesis, #4 Pillars, #6 Testimonios, #8 Leaderboard, #10 CTA).
 *
 * Register: "breaking the fourth wall / engine room of the secret society"
 * (plan: the dark half of the light/dark publication rhythm). Deep near-black /
 * dark-purple bg (DEEPER than the ink frame), WHITE headers, high-contrast body,
 * magenta/green/amber usable at FULL power.
 *
 * FLAT by default — per DESIGN.md "Borders, Shadows", dark marketing sections do
 * NOT get the hard offset shadow / HUD. We achieve dark coloring by REMAPPING the
 * standard CSS-var tokens (--paper/--ink/--card/--line/--muted/--muted-2) to the
 * dark `--arcade-*` section tokens on this wrapper ONLY — without setting
 * data-mode, so the `[[data-mode=arcade]_&]` shadow utilities on the shared
 * primitives (Button/Card/Badge/Avatar) stay OFF. Inside this section:
 *   - `bg-paper` / page bg     → deep arcade bg
 *   - `text-ink`               → white-ish body (use `text-white` for true white headers)
 *   - `bg-card` / `text-muted` / `border-line` etc. → their dark equivalents.
 *
 * `cabinet` (Leaderboard #8 only): ALSO sets data-mode="arcade", which both flips
 * the full arcade palette AND turns on the gated shadow/HUD utilities so the
 * high-score card renders as the full arcade cabinet. This is the single DESIGN.md
 * exception to "dark marketing sections stay flat".
 *
 * FULL-BLEED: this wrapper escapes the editorial max-width column; pass your own
 * inner `max-w-[var(--wrap)]` wrapper for content (see page.tsx). Server component.
 */

/** Remap the standard tokens to the dark section tokens (flat, no data-mode). */
const FLAT_DARK_VARS = {
  "--paper": "var(--arcade-bg)",
  "--surface": "var(--arcade-surface)",
  "--card": "var(--arcade-card)",
  "--ink": "var(--arcade-fg)",
  "--line": "var(--arcade-line)",
  "--muted": "var(--arcade-muted)",
  "--muted-2": "var(--arcade-muted-2)",
} as CSSProperties;

export interface ArcadeSectionProps {
  children: ReactNode;
  /** Stable section id (anchor target). */
  id?: string;
  /**
   * Leaderboard only: set data-mode="arcade" so the gated shadow/HUD utilities on
   * shared primitives render the full cabinet. FLAT otherwise.
   */
  cabinet?: boolean;
  /** Extra classes on the outer full-bleed band (e.g. vertical padding). */
  className?: string;
}

export function ArcadeSection({
  children,
  id,
  cabinet = false,
  className = "",
}: ArcadeSectionProps) {
  return (
    <section
      id={id}
      // When cabinet, data-mode="arcade" handles BOTH palette + shadow gating via
      // the globals.css [data-mode=arcade] block; otherwise remap tokens inline.
      data-mode={cabinet ? "arcade" : undefined}
      style={cabinet ? undefined : FLAT_DARK_VARS}
      className={`bg-paper text-ink ${className}`}
    >
      {children}
    </section>
  );
}
