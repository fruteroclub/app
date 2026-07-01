import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { Masthead, SiteFooter } from "@/components/marketing";
import { OpportunityBoard } from "@/components/marketing/OpportunityBoard";

/**
 * /marketplace — placeholder for the full Opportunity Marketplace.
 *
 * Launch state: reuse the public opportunity board, mark the page as in
 * development, and avoid implying self-serve submissions are ready.
 */
export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return buildMetadata({
    locale: locale as Locale,
    path: "/marketplace",
    title: t("marketplace.pageTitle"),
    description: t("marketplace.pageDescription"),
  });
}

export default async function MarketplacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Masthead />
      <main className="mx-auto w-full max-w-[var(--wrap)] px-7">
        <MarketplacePlaceholder />
      </main>
      <SiteFooter />
    </>
  );
}

function MarketplacePlaceholder() {
  const t = useTranslations("landing");

  return (
    <OpportunityBoard
      title={t("marketplace.pageTitle")}
      lead={t("marketplace.pageLead")}
      statusLabel={t("marketplace.status")}
      className="py-16 md:py-24"
    />
  );
}
