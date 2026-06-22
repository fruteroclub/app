import type { ReactNode } from "react";

import { Glyph, type GlyphName } from "@/components/Glyph";

/**
 * SectionHeading — the `.sh` mono section header from landing.html: a glyph, a
 * mono uppercase label, a hairline rule, and an optional right-aligned tag.
 *
 * Used by the /enterprise sections. Server component.
 */
export function SectionHeading({
  glyph,
  glyphColor = "var(--ink)",
  children,
  tag,
  id,
}: {
  glyph: GlyphName;
  glyphColor?: string;
  children: ReactNode;
  tag?: string;
  id?: string;
}) {
  return (
    <div id={id} className="mb-[30px] flex items-center gap-3">
      <Glyph name={glyph} size={14} style={{ color: glyphColor }} />
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink">
        {children}
      </h2>
      <span className="h-px flex-1 bg-line" />
      {tag ? (
        <span className="font-mono text-xs tracking-[0.1em] text-muted-2">
          {tag}
        </span>
      ) : null}
    </div>
  );
}
