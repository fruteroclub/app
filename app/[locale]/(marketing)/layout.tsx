import type { ReactNode } from "react";

import { GlyphDefs } from "@/components/Glyph";
import { PublicationFrame } from "@/components/marketing";
import { petrona } from "@/lib/fonts";

/**
 * Marketing route group. Public pages are PAPER-ONLY (D-mode, LOCKED): no MODO
 * toggle here — arcade mode lives only in the authed (app) group. Pages in this
 * group render as static SSG (the only island is the ContactForm on /enterprise,
 * owned by T6).
 *
 * This layout:
 *  - mounts the shared <GlyphDefs/> sprite once for the whole subtree, so the
 *    retro glyphs referenced by <Glyph/> resolve on every marketing page.
 *  - opts INTO the editorial serif: the landing hero lead + CTA-band lead use
 *    Petrona (DESIGN.md: serif is editorial-only and LAZY — loaded per-subtree
 *    here rather than globally, so data/app pages don't pay for it). The font
 *    var is scoped to this group's wrapper.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={petrona.variable}>
      <GlyphDefs />
      <PublicationFrame />
      {children}
    </div>
  );
}
