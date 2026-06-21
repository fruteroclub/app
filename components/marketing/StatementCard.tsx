import type { ReactNode } from "react";

import { Glyph, type GlyphName } from "@/components/Glyph";
import type { AccentColor } from "@/content/landing";

/**
 * StatementCard — reusable "poster / article card" design component.
 *
 * A full-height card that reads like a magazine feature poster or a newspaper
 * article: mono index + glyph row, a big Bitter title in the per-card accent
 * color, Geist body copy, and an optional bottom callout list (e.g. "real doors"
 * on the Desbloquea pillar). Used standalone by Pillars (#4) and reusable on
 * any other dark or light surface.
 *
 * Design rules:
 *   - FLAT: no shadows anywhere (DESIGN.md "Two surfaces / Marketing = FLAT").
 *   - Accent at full power: top 3px bar, index/glyph, Bitter title all carry the
 *     per-card accent. Body is `text-ink` (which ArcadeSection remaps to the
 *     light off-white arcade-fg inside dark bands).
 *   - Square corners (DESIGN.md: 0–6px max, border-radius = 0 here).
 *   - Border: 1px `border-line` hairline (dark variant handled by ArcadeSection
 *     token remap).
 *   - Background: `bg-paper` (ArcadeSection → arcade-bg, the deep near-black;
 *     callers can override via `className`).
 *   - Reusable: all content is prop-driven; callers supply localized strings.
 *     `callouts` is a generic `ReactNode[]` so any list item (string, badge,
 *     chip) can be passed.
 *
 * Typography map:
 *   index     → IBM Plex Mono, xs, semi, tracking wide
 *   glyph     → accent var, 22px decorative SVG
 *   title     → Bitter 700, 28px display, tight tracking, accent color
 *   body      → Geist 14.5px, relaxed leading, text-ink (remapped)
 *   callouts  → IBM Plex Mono, 11px, uppercase, semibold, muted-2 label
 */

/** Token map for the border, glyph, and index color, as CSS custom property refs. */
const ACCENT_VAR: Record<AccentColor, string> = {
  magenta: "var(--magenta)",
  green: "var(--green)",
  orange: "var(--orange)",
  muted: "var(--muted-canonical)",
};

/**
 * Title-badge text color: a remap-PROOF literal (these must not flip with the
 * ArcadeSection token remap). Light canon white on the darker magenta; canon dark
 * `--frame` on the brighter green/orange. WCAG-AA on each accent fill.
 */
const BADGE_TEXT: Record<AccentColor, string> = {
  magenta: "text-[#fffbf5]",
  green: "text-[#fffbf5]",
  orange: "text-[#fffbf5]",
  muted: "text-[#fffbf5]",
};

export interface StatementCardProps {
  /** Mono spine index, e.g. "01". */
  index: string;
  /** Retro SVG glyph mark. */
  glyph: GlyphName;
  /** Per-card accent color at full power (bar, glyph, title). */
  accent: AccentColor;
  /** Bitter display title (already localized). */
  title: ReactNode;
  /** Geist body copy (already localized). */
  body: ReactNode;
  /**
   * Optional bottom callout list items — mono uppercase, accent dot.
   * Pass already-localized strings (or any ReactNode). Shown after a small
   * top margin when present (e.g. "real doors" on Desbloquea / step 3).
   */
  callouts?: readonly ReactNode[];
  /**
   * ARIA label for the callout list (e.g. "Puertas reales"). Required when
   * `callouts` is non-empty to give the list an accessible description.
   */
  calloutsLabel?: string;
  /** Additional class(es) on the outer <article> (e.g. a custom bg, padding tweak). */
  className?: string;
}

export function StatementCard({
  index,
  glyph,
  accent,
  title,
  body,
  callouts,
  calloutsLabel,
  className = "",
}: StatementCardProps) {
  const accentVar = ACCENT_VAR[accent];

  return (
    // Thick 3px ACCENT border, NO fill (inherits the section bg — never the
    // --purple secondary over the dark bg). The card is a gallery frame in its
    // accent: between an art-exhibition plate and a highlighted videogame option.
    <article
      className={`relative flex h-full flex-col border-[3px] ${className}`}
      style={{ borderColor: accentVar }}
    >
      <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
        {/* ── Row: mono index (accent) + decorative glyph (accent) ── */}
        <div className="mb-5 flex items-center justify-between">
          <span
            className="font-mono text-sm font-bold tracking-[0.2em]"
            style={{ color: accentVar }}
          >
            {index}
          </span>
          <Glyph name={glyph} size={26} style={{ color: accentVar }} aria-hidden />
        </div>

        {/* ── Title BADGE — filled accent block, IBM Plex Mono, like a selected
              videogame menu option ── */}
        <h3 className="mb-5">
          <span
            className={`inline-block px-3.5 py-2 font-mono text-lg font-bold uppercase tracking-[0.04em] ${BADGE_TEXT[accent]}`}
            style={{ backgroundColor: accentVar }}
          >
            {title}
          </span>
        </h3>

        {/* ── Body — text-xl Geist, full-contrast text-ink (→ arcade-fg on dark) ── */}
        <p className="flex-1 font-sans text-xl leading-[1.45] text-ink">{body}</p>

        {/* ── Optional callout list (e.g. "real doors" on Desbloquea) ── */}
        {callouts && callouts.length > 0 ? (
          <ul className="mt-6 space-y-2" aria-label={calloutsLabel}>
            {callouts.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static, stable list
              <li
                key={i}
                className="flex items-center gap-2.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink"
              >
                {/* Accent square bullet */}
                <span
                  className="inline-block h-2 w-2 shrink-0"
                  style={{ backgroundColor: accentVar }}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
