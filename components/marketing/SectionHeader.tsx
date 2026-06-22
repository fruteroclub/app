import type { ReactNode } from "react";

import { Glyph, type GlyphName } from "@/components/Glyph";

/**
 * SectionHeader — the ONE reusable marketing section header.
 *
 * Abstracts the "glyph eyebrow + Bitter title + mono tag + hairline rule" pattern
 * that every landing beat hand-rolled (Thesis, Testimonios, Lo último, FAQ,
 * Pillars). Prop-driven, no hardcoded copy — pass already-localized
 * strings (call `t()` in the section, hand the results here). Usable on any page.
 *
 * REGISTER (the cypherpunk two-surface split, DESIGN.md "Two surfaces"):
 *   - 'editorial' (default) → warm PAPER beats. Title is `text-ink`; eyebrow +
 *     tag are `text-muted-2`; rule is `border-line`. The flat publication look.
 *   - 'arcade' → DARK <ArcadeSection> beats. Title flips to TRUE WHITE (the
 *     contract: arcade headers are white, not the off-white body); eyebrow/tag
 *     read on dark via the remapped `text-muted-2`/`border-line` tokens that the
 *     ArcadeSection wrapper already points at the `--arcade-*` group. No new hexes.
 *
 * Layout is a single stacked shape: eyebrow ABOVE the title, optional rule under
 * the whole header (Thesis / Testimonios / Lo último / Pillars / FAQ).
 *
 * Everything is optional except that you pass at least an `eyebrow` or a `title`.
 * Server component (no client hooks).
 */

export type SectionHeaderRegister = "editorial" | "arcade";

/** Accent token for the glyph color (defaults to the register's neutral). */
export type SectionHeaderAccent = "magenta" | "green" | "orange" | "neutral";

const ACCENT_VAR: Record<SectionHeaderAccent, string | undefined> = {
  magenta: "var(--magenta)",
  green: "var(--green)",
  orange: "var(--orange)",
  // neutral → inherit the register's muted token via currentColor (no override).
  neutral: undefined,
};

export interface SectionHeaderProps {
  /** Light paper vs dark arcade. Drives title color (ink vs true-white). */
  register?: SectionHeaderRegister;
  /** Optional leading glyph (retro SVG mark). */
  glyph?: GlyphName;
  /** Glyph accent color. Defaults to 'magenta' when a glyph is present. */
  glyphAccent?: SectionHeaderAccent;
  /** Mono uppercase kicker/label (already localized). */
  eyebrow?: ReactNode;
  /** Bitter display title (already localized). Omit for an eyebrow-only header. */
  title?: ReactNode;
  /** Show the hairline rule under the header. Default true. */
  rule?: boolean;
  /**
   * Render the eyebrow as a FILLED accent badge (the MIT "Collection" stamp).
   * USE SPARINGLY — a badge on every section reads cheap, and a badge that just
   * restates the title is worse. Default false → a clean big title (eyebrow, if
   * any, is a quiet mono kicker). Reserve the badge for a distinct genre label
   * (e.g. "Manifiesto").
   */
  badge?: boolean;
  /** Anchor id for the header wrapper. */
  id?: string;
  /** Extra classes on the outer wrapper (e.g. bottom margin). */
  className?: string;
  /** Heading element + size override. Defaults to a responsive clamp. */
  titleClassName?: string;
}

/** Title color is the only token that differs by register (white on arcade). */
function titleColor(register: SectionHeaderRegister): string {
  return register === "arcade" ? "text-white" : "text-ink";
}

export function SectionHeader({
  register = "editorial",
  glyph,
  glyphAccent,
  eyebrow,
  title,
  rule = true,
  badge = false,
  id,
  className = "",
  titleClassName = "font-display text-[clamp(34px,5vw,52px)] font-semibold leading-[1.02] tracking-[-0.02em]",
}: SectionHeaderProps) {
  const accent = glyphAccent ?? (glyph ? "magenta" : "neutral");
  // Badge fill: the accent (magenta/green/orange) or a dark --frame block when
  // neutral. Both remap-proof — they must not flip inside an ArcadeSection.
  const badgeBg = accent === "neutral" ? "var(--frame)" : ACCENT_VAR[accent]!;
  // Badge text: canon dark on the bright green/orange; canon white otherwise.
  const badgeText =
    accent === "green" || accent === "orange" ? "text-frame" : "text-[#fffbf5]";

  // Default = a clean BIG bold title. The eyebrow is optional: a quiet mono
  // kicker, or (badge=true, used sparingly) a filled accent stamp.
  return (
    <div id={id} className={className}>
      {eyebrow ? (
        badge ? (
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.16em] ${badgeText}`}
            style={{ backgroundColor: badgeBg }}
          >
            {glyph ? <Glyph name={glyph} size={13} className="shrink-0" /> : null}
            {eyebrow}
          </span>
        ) : (
          <span className="block font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-2">
            {eyebrow}
          </span>
        )
      ) : null}
      {title ? (
        <h2 className={`${eyebrow ? "mt-3" : ""} ${titleClassName} ${titleColor(register)}`}>
          {title}
        </h2>
      ) : null}
      {rule ? <div className="mt-6 h-[2px] w-full bg-line" /> : null}
    </div>
  );
}
