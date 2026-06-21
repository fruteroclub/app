import type { ReactNode } from "react";

/**
 * ManifestoBlock — a reusable two-column editorial + manifesto body layout.
 *
 * Design system (DESIGN.md / implementation plan):
 * - Left column: large Bitter display heading (the MANIFESTO headline, white on
 *   arcade, ink on editorial — set via `register`).
 * - Right column: Petrona editorial body copy (the "reading" voice — DESIGN.md
 *   "Reserved for editorial only: leads/deks, pull-quotes"). Vertically centered.
 * - Two columns ≥ md, single-column (heading first) on mobile.
 * - FLAT by design — no shadows. Works on both surfaces (tokens only, no hex).
 * - `register` drives ONLY the heading color (ink vs true-white). Body text
 *   (`text-ink`) resolves via the parent <ArcadeSection> token remap on dark
 *   surfaces, staying off-white (#f9f5ef = --arcade-fg) as intended.
 *
 * Reusable elsewhere (e.g. a future "About" or "Mission" editorial section) —
 * just pass localized children, no content is hardcoded.
 */

export type ManifestoBlockRegister = "editorial" | "arcade";

export interface ManifestoBlockProps {
  /** The large Bitter display heading (already localized). */
  heading: ReactNode;
  /** The Petrona manifesto body paragraph(s) (already localized). */
  body: ReactNode;
  /**
   * Surface register — drives heading color.
   * 'arcade' → true-white headline (dark band, highest contrast)
   * 'editorial' → text-ink (paper band)
   * Default: 'arcade' (primary use-case is the dark Thesis section).
   */
  register?: ManifestoBlockRegister;
  /**
   * Heading size override (fluid clamp). Default is the Thesis display size
   * (large, ~42–72px).
   */
  headingClassName?: string;
  /** Extra classes on the outer grid wrapper. */
  className?: string;
}

const HEADING_COLOR: Record<ManifestoBlockRegister, string> = {
  arcade: "text-white",
  editorial: "text-ink",
};

export function ManifestoBlock({
  heading,
  body,
  register = "arcade",
  headingClassName = "font-display text-[clamp(2.6rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.025em]",
  className = "",
}: ManifestoBlockProps) {
  return (
    <div
      className={[
        "grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16 lg:gap-24",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Left column: big Bitter display heading */}
      <div>
        <h2 className={`${headingClassName} ${HEADING_COLOR[register]}`}>
          {heading}
        </h2>
      </div>

      {/* Right column: Petrona editorial manifesto body, vertically centered */}
      <div className="flex flex-col justify-center gap-6">
        {Array.isArray(body) ? (
          body.map((para, i) => (
            <p
              key={i}
              className="font-serif text-lg leading-[1.65] text-ink"
            >
              {para}
            </p>
          ))
        ) : (
          <p className="font-serif text-lg leading-[1.65] text-ink">
            {body}
          </p>
        )}
      </div>
    </div>
  );
}
