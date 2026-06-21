import { useTranslations } from "next-intl";

import { OPPORTUNITIES, RARITY, type OppCurrency } from "@/content/landing";
import { SIGNUP_HREF } from "@/content/landing";
import { Link } from "@/i18n/navigation";

import { SectionHeader } from "./SectionHeader";
import { OpportunityCard, CURRENCY_TEXT, CURRENCY_DOT } from "./OpportunityCard";

/**
 * OpportunityMarketplace (#5 — "Lo que puedes desbloquear", reframed).
 *
 * A community classifieds board of "power-up" opportunities — a teaser for the
 * Opportunity Marketplace. Editorial register (warm paper, FLAT, hairlines). The
 * category bar (Reputación · Dinero · Experiencia) doubles as the "earn rep /
 * money / experiences" hint; each listing is tagged by currency (colored) + a
 * rarity tier (Pokémon-TCG; the membership role). Replaces the old level ladder +
 * unlock cards: the level gate now lives per-listing as the rarity.
 *
 * Server component. Data: OPPORTUNITIES (content/landing.ts, placeholder).
 */

const CURRENCIES: readonly OppCurrency[] = [
  "reputacion",
  "dinero",
  "experiencia",
] as const;

export function OpportunityMarketplace() {
  const t = useTranslations("landing");

  return (
    <section id="desbloquea" className="border-t border-line py-20 md:py-28">
      {/* Header + editorial lead */}
      <SectionHeader
        register="editorial"
        title={t("marketplace.heading")}
        rule={false}
        className="mb-3"
      />
      <p className="max-w-[58ch] font-serif text-lg leading-[1.4] text-muted">
        {t("marketplace.lead")}
      </p>

      {/* Currency category bar — doubles as the "earn rep / money / experiences" legend */}
      <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 border-y-2 border-ink py-3">
        {CURRENCIES.map((c) => (
          <span
            key={c}
            className={`inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] ${CURRENCY_TEXT[c]}`}
          >
            <span className={`inline-block h-2.5 w-2.5 ${CURRENCY_DOT[c]}`} aria-hidden="true" />
            {t(`currency.${c}`)}
          </span>
        ))}
        <span className="ml-auto font-mono text-xs uppercase tracking-[0.12em] text-muted-2">
          {t("marketplace.open")}
        </span>
      </div>

      {/* Board of opportunity listings */}
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {OPPORTUNITIES.map((o) => (
          <OpportunityCard
            key={o.id}
            currency={o.currency}
            currencyLabel={t(`currency.${o.currency}`)}
            rarity={o.rarity}
            rarityName={t(`${RARITY[o.rarity].i18nKey}.name`)}
            rarityRole={t(`${RARITY[o.rarity].i18nKey}.role`)}
            title={t(`${o.i18nKey}.title`)}
            body={t(`${o.i18nKey}.body`)}
            reward={t(`${o.i18nKey}.reward`)}
            poster={t(`${o.i18nKey}.poster`)}
          />
        ))}
      </div>

      {/* Marketplace close — teaser CTA */}
      <div className="mt-8">
        <Link
          href={SIGNUP_HREF}
          className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-magenta hover:underline"
        >
          {t("marketplace.explore")} →
        </Link>
      </div>
    </section>
  );
}
