import type { OppCurrency, Rarity } from "@/content/landing";
import { RarityBadge } from "./RarityBadge";

/**
 * OpportunityCard — one "post" on the Opportunity Marketplace board (#5).
 *
 * An editorial paper card (warm `card` bg, hairline border, FLAT). Reads like a
 * classifieds listing: a colored CURRENCY chip (what it pays) + a monochrome
 * RARITY badge (the tier/role), a Bitter title, a short body, then a reward +
 * poster footer. Prop-driven; reusable on a future full marketplace surface.
 */

/** Currency → accent text class (the chip + the reward color). */
export const CURRENCY_TEXT: Record<OppCurrency, string> = {
  reputacion: "text-magenta",
  dinero: "text-green",
  experiencia: "text-orange",
};

/** Currency → accent fill (the square chip marker). */
export const CURRENCY_DOT: Record<OppCurrency, string> = {
  reputacion: "bg-magenta",
  dinero: "bg-green",
  experiencia: "bg-orange",
};

export interface OpportunityCardProps {
  currency: OppCurrency;
  currencyLabel: string;
  rarity: Rarity;
  rarityName: string;
  rarityRole: string;
  title: string;
  body: string;
  reward: string;
  poster: string;
  className?: string;
}

export function OpportunityCard({
  currency,
  currencyLabel,
  rarity,
  rarityName,
  rarityRole,
  title,
  body,
  reward,
  poster,
  className = "",
}: OpportunityCardProps) {
  return (
    <article
      className={`flex h-full flex-col border-[3px] border-frame bg-surface p-6 ${className}`}
    >
      {/* Top: colored currency chip (left) + monochrome rarity badge (right) */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] ${CURRENCY_TEXT[currency]}`}
        >
          <span
            className={`inline-block h-2 w-2 ${CURRENCY_DOT[currency]}`}
            aria-hidden="true"
          />
          {currencyLabel}
        </span>
        <RarityBadge rarity={rarity} name={rarityName} role={rarityRole} show="symbol" />
      </div>

      {/* Title */}
      <h3 className="mt-4 font-display text-xl font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
        {title}
      </h3>

      {/* Body */}
      <p className="mt-2 flex-1 font-sans text-base leading-[1.5] text-muted">
        {body}
      </p>

      {/* Footer: reward value (accent) + who posted it */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
        <span className={`font-mono text-xs font-bold ${CURRENCY_TEXT[currency]}`}>
          {reward}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
          {poster}
        </span>
      </div>
    </article>
  );
}

/**
 * SponsorSlotCard — the "empty" slot at the end of the board (#5).
 *
 * Not an open opportunity: an ad placement CTA inviting a sponsor or a member to
 * publish here ("Publica aquí"). Rendered as a dashed-frame card so it visually
 * reads as a vacant slot rather than a live listing. Presentational — the
 * marketplace wraps it in a locale-aware <Link> (hence the `group-hover` accent).
 */
export interface SponsorSlotCardProps {
  label: string;
  title: string;
  body: string;
  cta: string;
  className?: string;
}

export function SponsorSlotCard({
  label,
  title,
  body,
  cta,
  className = "",
}: SponsorSlotCardProps) {
  return (
    <div
      className={`flex h-full flex-col border-[3px] border-dashed border-frame bg-surface/40 p-6 transition-colors group-hover:border-magenta ${className}`}
    >
      {/* Top: a muted "vacant slot" marker (no currency, no rarity) */}
      <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-2">
        {label}
      </span>

      {/* Title */}
      <h3 className="mt-4 font-display text-xl font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
        {title}
      </h3>

      {/* Body */}
      <p className="mt-2 flex-1 font-sans text-base leading-[1.5] text-muted">
        {body}
      </p>

      {/* Footer: the CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-dashed border-line pt-3">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-magenta">
          {cta} →
        </span>
      </div>
    </div>
  );
}
