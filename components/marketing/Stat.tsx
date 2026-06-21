/**
 * Stat — reusable mono stat cell (big numeral + small label).
 *
 * Follows the DESIGN.md "masthead-dateline" feel: IBM Plex Mono for both the
 * value and the label, hairline separator, no color wash on the value (ink on
 * paper, flat). Intended for ANY stat surface across the landing (proof bar,
 * future stat blocks, etc.) — not tightly coupled to the proof strip.
 *
 * DESIGN RULES:
 *   - value: large mono numeral, `--ink`. Never hardcode a hex.
 *   - label: tiny mono uppercase, `--muted-2`. Same no-hex rule.
 *   - accent: optional 4 px top accent bar (a single color-dot tick above the
 *     value) — kept off (undefined) for the ProofStrip to stay quiet / dateline.
 *     Pass 'magenta' | 'green' | 'orange' to light it up on future accent blocks.
 *   - Flat always — no shadow, no border-radius, no lifted card treatment.
 *
 * Server component — no hooks.
 */

import type { ReactNode } from "react";

import type { AccentColor } from "@/content/landing";
import { ACCENT } from "./cardStyles";

export interface StatProps {
  /** The displayed value — operator-supplied string, e.g. "+850". */
  value: ReactNode;
  /** Short label below the value — already localized. */
  label: ReactNode;
  /**
   * Optional 4 px color tick above the value.
   * Omit (default) for a quiet dateline stat (ProofStrip).
   * Pass an AccentColor for coloured accent blocks.
   */
  accent?: AccentColor;
  /**
   * Size variant.
   *   'lg' (default) — 34 px value, 11 px label. ProofStrip sizing.
   *   'sm' — 24 px value, 10 px label. For tighter grids.
   */
  size?: "lg" | "sm";
  /** Extra classes on the outer wrapper. */
  className?: string;
}

export function Stat({ value, label, accent, size = "lg", className = "" }: StatProps) {
  const valueSize = size === "lg" ? "text-[34px]" : "text-2xl";
  const labelSize = size === "lg" ? "text-xs" : "text-xs";

  return (
    <div className={className}>
      {accent ? (
        <div className={`mb-2 h-1 w-6 ${ACCENT[accent].edge}`} aria-hidden="true" />
      ) : null}

      {/* Big mono numeral */}
      <div
        className={`font-mono ${valueSize} font-bold leading-none tracking-[-0.02em] text-ink`}
      >
        {value}
      </div>

      {/* Small mono label */}
      <div
        className={`mt-1.5 font-mono ${labelSize} uppercase tracking-[0.12em] text-muted-2`}
      >
        {label}
      </div>
    </div>
  );
}
