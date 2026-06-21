import type { ReactNode } from "react";

import type { AccentColor } from "@/content/landing";

/**
 * TestimonialCard — a reusable "post" card for a single member voice.
 *
 * Design language (DESIGN.md / plan #6 Testimonios):
 *   - FLAT: no shadows. Hard square corners. Hairline `border-line` perimeter.
 *   - Tone accent bar (3 px, full-width) at the top — carries the card color.
 *   - Petrona italic quote in white/high-contrast (text-white) for maximum legibility
 *     on the dark ArcadeSection surface; Bitter for the decorative opening mark.
 *   - Attribution footer: IBM Plex Mono name + role, Nivel badge in the accent color.
 *   - Panel background: bg-card (remapped to --arcade-card inside ArcadeSection,
 *     which is --purple / #190433 — canon secondary, the dark card lift).
 *
 * Props are all pre-localized strings — the caller (Testimonials.tsx) owns i18n.
 * Reusable on any page that needs a member quote post (profile, directory, etc.).
 *
 * Surface awareness: designed for the DARK ArcadeSection surface. Token remapping
 * (`bg-card` → --arcade-card, `border-line` → --arcade-line, `text-muted-2` →
 * --arcade-muted-2) is handled upstream by ArcadeSection — this component uses
 * only canon Tailwind tokens. Do NOT hardcode hex values here.
 */

const BADGE_CLASSES: Record<AccentColor, string> = {
  magenta: "bg-magenta text-white",
  green: "bg-green text-black",
  orange: "bg-orange text-black",
  muted: "bg-[var(--muted-canonical)] text-white",
};

const BAR_CLASSES: Record<AccentColor, string> = {
  magenta: "bg-magenta",
  green: "bg-green",
  orange: "bg-orange",
  muted: "bg-[var(--muted-canonical)]",
};

export interface TestimonialCardProps {
  /** Member display name — shown verbatim, NOT localized. */
  name: string;
  /** Member role / location — already-localized string (e.g. "Full-Stack · CDMX"). */
  role: ReactNode;
  /** The quote body — already-localized string. Rendered in Petrona italic. */
  quote: ReactNode;
  /** Nivel number, e.g. "07". Displayed inside the accent-colored badge. */
  level: string;
  /** Accent color drives the top bar + the Nivel badge. */
  tone: AccentColor;
  /** Extra classes on the outer article (e.g. height matching in a grid). */
  className?: string;
}

export function TestimonialCard({
  name,
  role,
  quote,
  level,
  tone,
  className = "",
}: TestimonialCardProps) {
  return (
    <article
      className={`relative flex flex-col overflow-hidden border border-line bg-card ${className}`}
    >
      {/* Tone accent top bar — 3 px full-width stripe */}
      <span
        className={`block h-[3px] w-full flex-none ${BAR_CLASSES[tone]}`}
        aria-hidden="true"
      />

      {/* Quote body */}
      <blockquote className="flex flex-1 flex-col gap-6 px-5 py-6">
        {/* Decorative large opening quotation mark — Bitter, faded */}
        <span
          className="font-display text-[72px] leading-none text-muted-2 select-none"
          aria-hidden="true"
        >
          &ldquo;
        </span>

        {/* The member quote — Petrona italic, high contrast white */}
        <p className="mt-[-32px] font-serif italic text-lg leading-[1.6] text-white">
          {quote}
        </p>

        {/* Attribution footer — hairline rule then name + badge */}
        <footer className="mt-auto border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
            {/* Name + role — IBM Plex Mono */}
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-semibold uppercase tracking-[0.06em] text-ink">
                {name}
              </p>
              <p className="mt-0.5 truncate font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
                {role}
              </p>
            </div>

            {/* Nivel badge — accent-colored, mono, square, hairline border */}
            <div
              className={`flex flex-none flex-col items-center justify-center px-2.5 py-1.5 ${BADGE_CLASSES[tone]}`}
              style={{ border: "1px solid currentColor" }}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] opacity-80">
                NIVEL
              </span>
              <span className="font-mono text-lg font-bold leading-none">
                {level}
              </span>
            </div>
          </div>
        </footer>
      </blockquote>
    </article>
  );
}
