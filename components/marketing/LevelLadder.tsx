import type { ReactNode } from "react";

import { Glyph } from "@/components/Glyph";

/**
 * LevelLadder — reusable level-progression display (01→N, pinned unlock tiers).
 *
 * Renders a horizontal row of tier chips (level numbers). Locked tiers are dim
 * hairline squares; pinned tiers (the unlock levels) are accentuated with their
 * accent color + a diamond-tick connector below them so "sube de nivel = puertas
 * reales" is scannable at a glance.
 *
 * FLAT editorial (no shadows). Tailwind + canon token classes ONLY — no hex.
 * Server component (no hooks).
 *
 * @example
 * // Section-specific — use in Unlocks
 * const tiers: LevelTier[] = [
 *   { level: "05", accent: "magenta", label: "Demo Slots" },
 *   { level: "08", accent: "green",   label: "Estadía CDMX" },
 * ];
 * <LevelLadder totalLevels={10} tiers={tiers} eyebrow="Sube de nivel →" />
 *
 * // Generic — reusable on profile, directory, any page
 * <LevelLadder totalLevels={10} tiers={[]} />
 */

export type LevelTierAccent = "magenta" | "green" | "orange";

export interface LevelTier {
  /** Zero-padded level number, e.g. "05". Must be within [1, totalLevels]. */
  level: string;
  accent: LevelTierAccent;
  /** Optional short label pinned under the tier tick (mono, truncated). */
  label?: ReactNode;
}

export interface LevelLadderProps {
  /** Total number of levels (default 10). Chip row runs 01→totalLevels. */
  totalLevels?: number;
  /** Pinned unlock tiers within the ladder. */
  tiers?: readonly LevelTier[];
  /** Optional mono kicker label printed left of the chip row. */
  eyebrow?: ReactNode;
  /** Extra classes on the outer wrapper (e.g. bottom margin). */
  className?: string;
}

/** Tailwind accent token maps — no hardcoded hex. */
const CHIP_ACCENT: Record<
  LevelTierAccent,
  { border: string; text: string; connector: string }
> = {
  magenta: {
    border: "border-magenta",
    text: "text-magenta",
    connector: "bg-magenta",
  },
  green: {
    border: "border-green",
    text: "text-green",
    connector: "bg-green",
  },
  orange: {
    border: "border-orange",
    text: "text-orange",
    connector: "bg-orange",
  },
};

export function LevelLadder({
  totalLevels = 10,
  tiers = [],
  eyebrow,
  className = "",
}: LevelLadderProps) {
  // Build a map of level string → tier config for O(1) lookup.
  const tierMap = new Map(tiers.map((t) => [t.level, t]));

  const levels = Array.from({ length: totalLevels }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { n, tier: tierMap.get(n) ?? null };
  });

  return (
    <div className={className}>
      {/* Optional eyebrow label */}
      {eyebrow ? (
        <div className="mb-4">
          <span className="font-mono text-xs tracking-[0.16em] uppercase text-muted-2">
            {eyebrow}
          </span>
        </div>
      ) : null}

      {/* Chip row */}
      <div className="flex flex-wrap gap-2" role="list" aria-label="Nivel">
        {levels.map(({ n, tier }) => {
          const isPinned = tier !== null;
          const accentTokens = isPinned ? CHIP_ACCENT[tier!.accent] : null;

          return (
            <div
              key={n}
              role="listitem"
              className="flex flex-col items-center gap-1.5"
            >
              {/* Tier chip */}
              <span
                aria-label={isPinned ? `Nivel ${n} — desbloqueado` : `Nivel ${n}`}
                className={[
                  "flex h-[34px] w-[46px] items-center justify-center border font-mono text-xs font-semibold tracking-[0.06em]",
                  isPinned
                    ? `${accentTokens!.border} bg-paper ${accentTokens!.text}`
                    : "border-line bg-paper text-muted-2",
                ].join(" ")}
              >
                {n}
              </span>

              {/* Connector + diamond tick for pinned tiers */}
              {isPinned ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={`block h-[14px] w-px ${accentTokens!.connector}`}
                    aria-hidden="true"
                  />
                  <Glyph
                    name="diamond"
                    size={10}
                    className={accentTokens!.text}
                    aria-hidden
                  />
                </div>
              ) : (
                /* Spacer keeps all chips baseline-aligned */
                <span className="h-[28px]" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend row — one pill per pinned tier */}
      {tiers.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5">
          {tiers.map((tier) => {
            const accentTokens = CHIP_ACCENT[tier.accent];
            return (
              <div key={tier.level} className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-xs tracking-[0.1em] uppercase ${accentTokens.text}`}
                >
                  Nv{tier.level}
                </span>
                {tier.label ? (
                  <span className="font-mono text-xs tracking-[0.06em] text-muted-2">
                    {tier.label}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
