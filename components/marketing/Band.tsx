import type { ReactNode } from "react";

/**
 * Band — reusable full-bleed closing-band shell for dark marketing sections.
 *
 * Provides the structural skeleton: a centered content column with consistent
 * vertical rhythm and a subtle halftone texture baked via a CSS-only overlay
 * (radial-gradient dots at low opacity, same recipe as cardStyles.ts `duotone()`).
 * No hardcoded hex values — uses only canon Tailwind tokens + CSS custom props.
 *
 * Designed to be dropped inside an <ArcadeSection> (which handles the dark token
 * remap and the bg-paper → arcade-bg flip). The Band does NOT redeclare colors;
 * it only wraps, centers, and optionally textures.
 *
 * Usage:
 *   <ArcadeSection id="cta">
 *     <Band>
 *       ... section content ...
 *     </Band>
 *   </ArcadeSection>
 *
 * Props:
 *   children    — section body
 *   texture     — (default true) add the subtle halftone dot overlay
 *   py          — vertical padding override class (default "py-20 md:py-28")
 *   className   — extra classes on the inner column wrapper
 *
 * Server component.
 */

export interface BandProps {
  children: ReactNode;
  /** Halftone dot texture overlay (CSS-only, no image/API). Default true. */
  texture?: boolean;
  /** Vertical padding Tailwind class(es). Default "py-20 md:py-28". */
  py?: string;
  /** Extra Tailwind classes on the inner max-w column. */
  className?: string;
}

/**
 * The halftone overlay: a repeating 5px radial-gradient dot grid at low opacity
 * — same dot-screen recipe as duotone() in cardStyles.ts, but applied as a pure
 * CSS background-image overlay rather than inline style, so it blends with the
 * ArcadeSection bg without introducing any hex color.
 */
const TEXTURE_STYLE: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(249,245,239,0.06) 1px, transparent 1.5px)",
  backgroundSize: "5px 5px",
};

export function Band({
  children,
  texture = true,
  py = "py-20 md:py-28",
  className = "",
}: BandProps) {
  return (
    // Relative container so the texture (absolute layer) stays within bounds.
    <div className="relative" style={texture ? TEXTURE_STYLE : undefined}>
      <div
        className={`relative mx-auto max-w-[var(--wrap)] px-7 ${py} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
