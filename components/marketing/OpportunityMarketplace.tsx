import { useTranslations } from "next-intl";

import { OpportunityBoard } from "./OpportunityBoard";

/**
 * OpportunityMarketplace (#5 — "Lo que puedes desbloquear", reframed).
 *
 * Landing teaser for the full marketplace route. Editorial register (warm paper,
 * FLAT, hairlines). The full page reuses the same board and stays in development
 * until submissions and fulfillment exist.
 */
export function OpportunityMarketplace() {
  const t = useTranslations("landing");

  return (
    <OpportunityBoard
      id="oportunidades"
      title={t("marketplace.heading")}
      lead={t("marketplace.lead")}
      className="border-t border-line py-20 md:py-28"
    />
  );
}
