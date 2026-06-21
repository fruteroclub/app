import type { ReactNode } from "react";

import { Badge } from "@/components/ui";
import { Glyph, type GlyphName } from "@/components/Glyph";

/**
 * UnlockCard — reusable prize-poster card (DESIGN.md → Components: "Unlock card").
 *
 * A hard-bordered editorial card (FLAT — no shadows on the marketing surface) that
 * presents a single real-world unlock / reward. Used in the #5 Lo que desbloqueas
 * section and reusable anywhere a "prize at a level threshold" needs to be presented.
 *
 * Anatomy (top → bottom):
 *   ┌──────────────────────────────────────────────┐  ← 4px accent top-bar
 *   │  [title]                         [Nivel 05+]  │  ← row: Bitter title + tier badge
 *   │  [body paragraph]                             │
 *   │  ◇ [meta line]                                │  ← mono meta / unlock condition
 *   │  [optional image slot]                        │  ← duotone CSS cover (no image gen)
 *   └──────────────────────────────────────────────┘
 *
 * All copy is passed as props (prop-driven, no hardcoded text). Server component.
 *
 * @example
 * <UnlockCard
 *   accent="magenta"
 *   level="05"
 *   tierLabel="Nivel 05+"
 *   title="Demo Slots — CDMX"
 *   body="Presenta tu proyecto ante la comunidad en un evento en vivo."
 *   meta="Desbloqueado al llegar a Nivel 05"
 * />
 */

export type UnlockCardAccent = "magenta" | "green" | "orange" | "muted";

export interface UnlockCardProps {
  /** Primary accent: drives the top-bar color + tier badge tone. */
  accent: UnlockCardAccent;
  /** Zero-padded minimum level (e.g. "05"). */
  level: string;
  /** Localized tier badge label (e.g. "Nivel 05+"). */
  tierLabel: ReactNode;
  /** Bitter card title. */
  title: ReactNode;
  /** Geist body paragraph. */
  body: ReactNode;
  /** Mono meta / unlock-condition line (shown after a diamond glyph). */
  meta: ReactNode;
  /**
   * Optional leading glyph on the meta line. Defaults to "diamond".
   * Pass null to suppress the glyph entirely.
   */
  metaGlyph?: GlyphName | null;
  /** Extra classes on the outer card wrapper. */
  className?: string;
}

/** Top-bar accent color, driven by CSS var (no hardcoded hex). */
const ACCENT_BAR: Record<UnlockCardAccent, string> = {
  magenta: "var(--magenta)",
  green: "var(--green)",
  orange: "var(--orange)",
  muted: "var(--muted-canonical)",
};

/** Badge tone names for the tier chip (matches badge.tsx variant=tier token set). */
const BADGE_TONE_CLASS: Record<UnlockCardAccent, string> = {
  magenta: "",   // tier default (purple bg + white text) is intentional
  green: "",
  orange: "",
  muted: "",
};
// Note: Badge variant="tier" is always the purple-block chip by design (DESIGN.md:
// "tier chip: purple block, 1.5px hard border"). The accent color lives on the card
// border/bar, not the badge. We keep the tier badge consistent across all unlocks.
void BADGE_TONE_CLASS;

export function UnlockCard({
  accent,
  tierLabel,
  title,
  body,
  meta,
  metaGlyph = "diamond",
  className = "",
}: UnlockCardProps) {
  return (
    <div
      className={`relative border-2 border-black bg-card pt-8 p-6 ${className}`}
    >
      {/* 4px accent top-bar */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-1 w-[50px]"
        style={{ background: ACCENT_BAR[accent] }}
      />

      {/* Header row: Bitter title + tier badge */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.01em] text-ink">
          {title}
        </h3>
        <Badge variant="tier" className="mt-0.5 shrink-0">
          {tierLabel}
        </Badge>
      </div>

      {/* Body copy */}
      <p className="mb-[18px] text-sm leading-[1.5] text-muted">{body}</p>

      {/* Meta / unlock condition */}
      <div className="flex items-center gap-1.5 font-mono text-xs tracking-[0.06em] text-muted-2">
        {metaGlyph !== null ? (
          <Glyph
            name={metaGlyph ?? "diamond"}
            size={10}
            className="shrink-0 text-muted-2"
            aria-hidden
          />
        ) : null}
        <span>{meta}</span>
      </div>
    </div>
  );
}
