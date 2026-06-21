import type { CSSProperties } from "react";

import type { AccentColor } from "@/content/landing";

/**
 * Shared styling for the community publication surfaces (CommunityFrontPage + the
 * parked CommunityCard/Deck): the per-accent class map and the duotone/halftone
 * cover generator. Kept here so the lead image and the list thumbs draw the same
 * brand "duotone pass" without duplicating the recipe.
 *
 * IMAGE STRATEGY (landing sections — no generated assets, no image APIs):
 *   1. PREFERRED — use `duotone(varName, seed)` below for every cover / thumb /
 *      portrait slot. It is a pure-CSS riso/halftone fill (DESIGN.md "Iconography":
 *      halftone/riso fills, duotone avatar placeholders). No network, no asset, no
 *      OpenAI/image-gen call. This is the default for all image slots.
 *   2. ONLY IF a photographic placeholder is genuinely required, drop a plain
 *      <img src="https://picsum.photos/seed/<stable-seed>/<w>/<h>"> (the pattern
 *      already used in Hero.tsx) and mark it `// TODO-swap` so the operator's real
 *      photo replaces it before go-live.
 *   Do NOT add image files to the repo and do NOT generate images.
 */

export const ACCENT: Record<
  AccentColor,
  { chip: string; edge: string; stat: string; dot: string; varName: string }
> = {
  magenta: {
    chip: "bg-magenta text-paper",
    edge: "bg-magenta",
    stat: "text-magenta",
    dot: "bg-magenta",
    varName: "var(--magenta)",
  },
  green: {
    chip: "bg-green text-black",
    edge: "bg-green",
    stat: "text-green",
    dot: "bg-green",
    varName: "var(--green)",
  },
  orange: {
    chip: "bg-orange text-black",
    edge: "bg-orange",
    stat: "text-orange",
    dot: "bg-orange",
    varName: "var(--orange)",
  },
  muted: {
    chip: "bg-[var(--muted-canonical)] text-paper",
    edge: "bg-[var(--muted-canonical)]",
    stat: "text-[var(--muted-canonical)]",
    dot: "bg-[var(--muted-canonical)]",
    varName: "var(--muted-canonical)",
  },
};

/** A duotone + halftone cover (CSS only, no external image), varied by `seed`. */
export function duotone(varName: string, seed: number): CSSProperties {
  const angle = 118 + (seed % 5) * 26;
  const dot = 5 + (seed % 3) * 2;
  return {
    backgroundColor: "var(--ink)",
    backgroundImage: [
      "radial-gradient(circle at 1px 1px, rgba(249,245,239,0.18) 1px, transparent 1.5px)",
      `linear-gradient(${angle}deg, ${varName}, color-mix(in srgb, ${varName} 20%, var(--ink)))`,
    ].join(", "),
    backgroundSize: `${dot}px ${dot}px, cover`,
    backgroundBlendMode: "overlay, normal",
  };
}
