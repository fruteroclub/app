import { useTranslations } from "next-intl";

import { OPPORTUNITIES, RARITY, type OppCurrency } from "@/content/landing";
import { ENTERPRISE_HREF } from "@/content/landing";
import { Link } from "@/i18n/navigation";

import { SectionHeader } from "./SectionHeader";
import {
  OpportunityCard,
  SponsorSlotCard,
  CURRENCY_TEXT,
  CURRENCY_DOT,
} from "./OpportunityCard";

// v0 legend shows only the currencies the board actually pays today (Reputacion
// + Experiencia). `dinero` returns to the legend when paid bounties land.
const CURRENCIES: readonly OppCurrency[] = [
  "reputacion",
  "experiencia",
] as const;

export interface OpportunityBoardProps {
  id?: string;
  title: string;
  lead: string;
  statusLabel?: string;
  className?: string;
}

export function OpportunityBoard({
  id,
  title,
  lead,
  statusLabel,
  className = "",
}: OpportunityBoardProps) {
  const t = useTranslations("landing");

  return (
    <section id={id} className={className}>
      <div>
        <SectionHeader
          register="editorial"
          title={title}
          rule={false}
          className="mb-3"
        />
        <p className="max-w-[58ch] font-serif text-lg leading-[1.4] text-muted">
          {lead}
        </p>
        {statusLabel ? (
          <div
            role="status"
            className="mt-8 border-2 border-ink bg-frame text-paper"
          >
            <div className="flex items-center gap-3 border-l-[10px] border-magenta px-5 py-4">
              <span className="h-2.5 w-2.5 bg-magenta" aria-hidden="true" />
              <span className="font-mono text-sm font-bold uppercase tracking-[0.18em]">
                {statusLabel}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 border-y-2 border-ink py-3">
        {CURRENCIES.map((currency) => (
          <span
            key={currency}
            className={`inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] ${CURRENCY_TEXT[currency]}`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 ${CURRENCY_DOT[currency]}`}
              aria-hidden="true"
            />
            {t(`currency.${currency}`)}
          </span>
        ))}
        <span className="ml-auto font-mono text-xs uppercase tracking-[0.12em] text-muted-2">
          {t("marketplace.open")}
        </span>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {OPPORTUNITIES.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            currency={opportunity.currency}
            currencyLabel={t(`currency.${opportunity.currency}`)}
            rarity={opportunity.rarity}
            rarityName={t(`${RARITY[opportunity.rarity].i18nKey}.name`)}
            rarityRole={t(`${RARITY[opportunity.rarity].i18nKey}.role`)}
            title={t(`${opportunity.i18nKey}.title`)}
            body={t(`${opportunity.i18nKey}.body`)}
            reward={t(`${opportunity.i18nKey}.reward`)}
            poster={t(`${opportunity.i18nKey}.poster`)}
          />
        ))}

        <Link href={ENTERPRISE_HREF} className="group block h-full">
          <SponsorSlotCard
            label={t("marketplace.sponsor.label")}
            title={t("marketplace.sponsor.title")}
            body={t("marketplace.sponsor.body")}
            cta={t("marketplace.sponsor.cta")}
          />
        </Link>
      </div>
    </section>
  );
}
