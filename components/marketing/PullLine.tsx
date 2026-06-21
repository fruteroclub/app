import type { ReactNode } from "react";

/**
 * PullLine — a heavy Bitter accent closing line, reusable anywhere a
 * manifesto-style punctuation statement is needed.
 *
 * Design system (DESIGN.md):
 * - Font: Bitter (--display), extrabold, tight tracking — the display slab
 * - Accent: token-driven (`text-magenta`, `text-green`, `text-orange`, or any
 *   Tailwind text-* token passed via `className`). Default: text-magenta.
 * - FLAT: no shadows, no borders — pure typographic weight.
 * - Register: works on BOTH editorial (paper) and arcade (dark) surfaces because
 *   it uses token classes (text-magenta reads at full power on dark via <ArcadeSection>
 *   token remap and on light via the canonical palette). The accent is HIGHEST CONTRAST
 *   intended — the full-power color spec for Thesis says magenta at full power.
 *
 * Usage:
 *   <PullLine accent="magenta">"Sube de nivel = puertas reales."</PullLine>
 *   <PullLine accent="green" size="lg">Sube. Gana. Repite.</PullLine>
 */

export type PullLineAccent = "magenta" | "green" | "orange";

/** Size variant — maps to a fluid clamp. */
export type PullLineSize = "base" | "lg" | "xl";

const SIZE_CLASS: Record<PullLineSize, string> = {
  // ~ 26–38px fluid
  base: "text-[clamp(1.6rem,3.5vw,2.4rem)]",
  // ~ 32–45px fluid
  lg: "text-[clamp(2rem,4vw,2.8rem)]",
  // ~ 40–60px fluid
  xl: "text-[clamp(2.5rem,5.5vw,3.75rem)]",
};

const ACCENT_CLASS: Record<PullLineAccent, string> = {
  magenta: "text-magenta",
  green: "text-green",
  orange: "text-orange",
};

export interface PullLineProps {
  children: ReactNode;
  /** Accent color token. Default: magenta. */
  accent?: PullLineAccent;
  /** Scale variant. Default: lg (matches Thesis use-case). */
  size?: PullLineSize;
  /** Optional hairline rule above (for section separators). */
  rule?: boolean;
  /** Extra Tailwind classes (margins, custom color override, etc.). */
  className?: string;
}

export function PullLine({
  children,
  accent = "magenta",
  size = "lg",
  rule = false,
  className = "",
}: PullLineProps) {
  return (
    <>
      {rule ? <div className="h-px w-full border-t border-line" /> : null}
      <p
        className={[
          "font-display font-semibold leading-tight tracking-[-0.02em]",
          SIZE_CLASS[size],
          ACCENT_CLASS[accent],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </p>
    </>
  );
}
