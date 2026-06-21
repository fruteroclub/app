import { useTranslations } from "next-intl";

import { SectionHeader } from "./SectionHeader";
import { FaqTabs } from "./FaqTabs";

/**
 * Faq (#9) — Objection-killers on warm PAPER (editorial register, FLAT).
 *
 * Mechanic: the vertical analog of the Lo último page-tabs — a stack of question
 * bars whose answers ease open/closed like a window (see {@link FaqTabs}). Same
 * visual language as the magazine tabs (black-square index, ink frame).
 *
 * Server component; the open/close state lives in the FaqTabs client island.
 * Data: FAQ_ITEMS (content/landing.ts), 5 items incl. the crypto/jargon objection.
 * Copy keys: faq.heading · faq.items.<id>.{q,a}
 */
export function Faq() {
  const t = useTranslations("landing");

  return (
    <section id="faq" className="border-t-2 border-ink py-20 md:py-28">
      <SectionHeader
        register="editorial"
        title={t("faq.heading")}
        rule={false}
        className="mb-6"
        titleClassName="font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-semibold tracking-[-0.025em] text-ink"
      />

      <FaqTabs />
    </section>
  );
}
