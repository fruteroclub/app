import type { SVGProps } from 'react'

/**
 * Retro-futuristic geometric glyphs (DESIGN.md → "Iconography").
 *
 * Crisp inline SVG marks (NOT pixel fonts, NOT unicode). The full symbol set is
 * defined ONCE per document by <GlyphDefs/> (render it high in each route's tree,
 * e.g. in the layout), then any number of <Glyph name="..." /> reference it via
 * <use href="#g-..."/> — exactly the pattern in the preview HTMLs.
 *
 * Symbols are lifted verbatim from docs/design/previews/*.html <svg><defs>.
 */

export const GLYPH_NAMES = [
  'target',
  'grid',
  'hex',
  'bolt',
  'star',
  'diamond',
  'search',
  'mark',
] as const

export type GlyphName = (typeof GLYPH_NAMES)[number]

/**
 * The shared sprite sheet. Render exactly once per document (the locale layout).
 * Hidden, zero-size, absolutely positioned so it never affects layout.
 */
export function GlyphDefs() {
  return (
    <svg
      width={0}
      height={0}
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0 }}
    >
      <defs>
        <symbol id="g-target" viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="8" cy="8" r="1.6" fill="currentColor" />
          <path
            d="M8 0v3M8 13v3M0 8h3M13 8h3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </symbol>
        <symbol id="g-grid" viewBox="0 0 16 16">
          <rect
            x="1"
            y="1"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.3" />
        </symbol>
        <symbol id="g-hex" viewBox="0 0 16 16">
          <path
            d="M8 1l6 3.5v7L8 15l-6-3.5v-7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </symbol>
        <symbol id="g-bolt" viewBox="0 0 16 16">
          <path d="M9 1L3 9h4l-1 6 7-9H9z" fill="currentColor" />
        </symbol>
        <symbol id="g-star" viewBox="0 0 16 16">
          <path
            d="M8 1l1.8 4.4L14 6l-3.3 3 1 4.6L8 11.3 4.3 13.6l1-4.6L2 6l4.2-.6z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="g-diamond" viewBox="0 0 16 16">
          <path d="M8 1l7 7-7 7-7-7z" fill="currentColor" />
        </symbol>
        <symbol id="g-search" viewBox="0 0 16 16">
          <circle
            cx="7"
            cy="7"
            r="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.5" />
        </symbol>
        {/* Brand mark: magenta circle with the white "fruit/pulpa" curl. */}
        <symbol id="g-mark" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="11"
            fill="var(--magenta)"
            stroke="var(--black)"
            strokeWidth="2"
          />
          <path
            d="M12 6c2 2 2 4 0 6s-2 4 0 6"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="1.6" fill="#fff" />
        </symbol>
      </defs>
    </svg>
  )
}

export interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  name: GlyphName
  /** px size; sets width + height. Default 16. */
  size?: number
  /** Accessible label. When omitted the glyph is decorative (aria-hidden). */
  title?: string
}

/**
 * A single glyph. References the shared sprite via <use>. Color follows
 * `currentColor` (set `style={{ color: 'var(--magenta)' }}` or a text-* class).
 */
export function Glyph({
  name,
  size = 16,
  title,
  ...props
}: GlyphProps) {
  const decorative = title == null
  return (
    <svg
      width={size}
      height={size}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <use href={`#g-${name}`} />
    </svg>
  )
}
