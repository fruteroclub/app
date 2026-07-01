import type { CSSProperties } from "react";

import type { Rarity } from "@/content/landing";
import { RarityBadge } from "./RarityBadge";

/**
 * PlayerCard — a member's testimonial card (#6). Warm-paper card with a MUTED
 * border: a round avatar + optional project subtitle, the member's testimonial as
 * the body, and a footer of role · rarity symbol · city. The rarity tier (the
 * Pokémon-TCG mechanic) lives as a single symbol in the footer center.
 *
 * A paper island on the dark band, so it resets to the canon LIGHT tokens.
 * Avatar is a picsum placeholder (TODO-swap real member photos).
 */

/** Canon LIGHT tokens — re-establish the paper register inside a dark section. */
const PAPER_CARD_VARS: CSSProperties = {
  "--paper": "#f9f5ef",
  "--surface": "#ece6dd",
  "--card": "#fffbf5",
  "--ink": "#11091e",
  "--muted": "#5b5170",
  "--muted-2": "#8a8198",
  "--line": "#dcd3c4",
  "--black": "#08000f",
} as CSSProperties;

export interface PlayerCardProps {
  name: string;
  /** Reserved for the project name once project submissions exist. */
  projectName?: string;
  /** The member's testimonial. */
  quote: string;
  rarity: Rarity;
  rarityName: string;
  rarityRole: string;
  /** Current member role/category — footer left until project metadata lands. */
  role: string;
  /** City / region — footer right. */
  city: string;
  /** Stable seed for the placeholder avatar photo. */
  avatarSeed: string;
  /** Optional real member avatar. Falls back to the generated placeholder. */
  avatarUrl?: string;
  className?: string;
}

export function PlayerCard({
  name,
  projectName,
  role,
  quote,
  rarity,
  rarityName,
  rarityRole,
  city,
  avatarSeed,
  avatarUrl,
  className = "",
}: PlayerCardProps) {
  const imageSrc =
    avatarUrl ?? `https://picsum.photos/seed/${avatarSeed}/140/140`;

  return (
    <article
      className={`flex flex-col border-[3px] border-[var(--muted-canonical)] bg-surface ${className}`}
      style={PAPER_CARD_VARS}
    >
      {/* Header: round avatar + stacked name / future project subtitle. */}
      <div className="flex items-center gap-4 px-5 pb-5 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- placeholder avatar, swap to real member photos */}
        <img
          src={imageSrc}
          alt={name}
          className="h-16 w-16 shrink-0 rounded-full object-cover grayscale"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold tracking-[-0.01em] text-ink">
            {name}
          </p>
          {projectName ? (
            <p className="truncate font-mono text-sm uppercase tracking-[0.1em] text-muted-2">
              {projectName}
            </p>
          ) : null}
        </div>
      </div>

      {/* Testimonial — the body (bottom half) */}
      <p className="flex-1 px-5 pb-6 font-serif text-lg leading-relaxed text-ink">
        &ldquo;{quote}&rdquo;
      </p>

      {/* Footer: role (left) · rarity symbol (center) · city (right) */}
      <div className="grid grid-cols-3 items-center border-t border-line px-4 py-3">
        <span className="truncate font-mono text-xs uppercase tracking-[0.04em] text-muted-2">
          {role}
        </span>
        <span className="flex justify-center">
          <RarityBadge
            rarity={rarity}
            name={rarityName}
            role={rarityRole}
            show="symbol"
          />
        </span>
        <span className="truncate text-right font-mono text-xs uppercase tracking-[0.04em] text-muted-2">
          {city}
        </span>
      </div>
    </article>
  );
}
