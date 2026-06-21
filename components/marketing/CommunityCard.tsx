import { Glyph } from "@/components/Glyph";
import type { CommunityCardData } from "@/content/cards";

import { ACCENT, duotone } from "./cardStyles";

/**
 * CommunityCard — one flat publication card (a community dispatch).
 *
 * A duotone cover up top (CSS halftone block, no external image — DESIGN.md
 * "halftone/riso fills"), a category "type" chip + collector index over the cover,
 * a Bitter title, and a three-cell bottom stats row (time · author · accent stat).
 * Square corners + hard 2px ink border, NO shadow (marketing is the flat editorial
 * publication — the sticker shadow lives in the arcade app; see DESIGN.md "Two
 * surfaces"). Presentational + server-renderable.
 */

export function CommunityCard({
  card,
  seed = 0,
}: {
  card: CommunityCardData;
  seed?: number;
}) {
  const a = ACCENT[card.accent];
  return (
    <article className="flex h-full w-full flex-col overflow-hidden border-hard bg-card">
      <span className={`h-1 w-full flex-none ${a.edge}`} aria-hidden="true" />

      <div
        className="relative aspect-[16/10] w-full flex-none"
        style={duotone(a.varName, seed)}
      >
        <span
          className={`absolute left-0 top-0 inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] ${a.chip}`}
        >
          <Glyph name={card.glyph} size={11} /> {card.category}
        </span>
        <span className="absolute right-2.5 top-2 flex items-center gap-1.5 font-mono text-xs tracking-[0.08em] text-paper/85">
          <span
            className="inline-block h-1.5 w-1.5 rotate-45 bg-paper/80"
            aria-hidden="true"
          />
          {card.collector}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-xl font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
          {card.title}
        </h3>
        <div className="mt-auto grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-line pt-2.5 font-mono text-xs uppercase tracking-[0.08em] text-muted-2">
          <span>{card.time}</span>
          <span className="text-center">{card.author}</span>
          <span className={`text-right font-semibold ${a.stat}`}>
            {card.stat}
          </span>
        </div>
      </div>
    </article>
  );
}
