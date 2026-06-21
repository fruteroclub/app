import { Glyph } from "@/components/Glyph";
import { RARITY, type Rarity } from "@/content/landing";

/**
 * RarityBadge — the membership rarity tier (Pokémon-TCG inspired).
 *   common   → ● dot     · Community Member
 *   uncommon → ◆ diamond · Club Member
 *   rare     → ★ star     · Club Contributor
 * (Higher rarities — Core Contributor, Founder… — slot in later.)
 *
 * MONOCHROME by design: the SYMBOL conveys the tier, so the colored currency chip
 * is the only hue on an opportunity. "dot" renders as a CSS circle; the rest are
 * Glyphs. Reusable on any surface that shows a member/opportunity tier.
 */
export interface RarityBadgeProps {
  rarity: Rarity;
  /** Localized rarity name (Común / Uncommon / Rare). */
  name: string;
  /** Localized membership role (Community Member / Club Member / Club Contributor). */
  role: string;
  /**
   * "full" → symbol + name · role (default). "role" → symbol + role only.
   * "symbol" → just the rarity symbol (no text).
   */
  show?: "full" | "role" | "symbol";
  className?: string;
}

export function RarityBadge({ rarity, name, role, show = "full", className = "" }: RarityBadgeProps) {
  const { symbol } = RARITY[rarity];
  const sym = symbol === "dot" ? 8 : 13;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.1em] ${className}`}
    >
      {symbol === "dot" ? (
        <span
          className="inline-block rounded-full bg-ink"
          style={{ height: sym, width: sym }}
          aria-hidden="true"
        />
      ) : (
        <Glyph name={symbol} size={sym} className="text-ink" aria-hidden />
      )}
      {show === "full" && (
        <>
          <span className="font-bold text-ink">{name}</span>
          <span className="text-muted-2">· {role}</span>
        </>
      )}
      {show === "role" && <span className="font-bold text-ink">{role}</span>}
    </span>
  );
}
