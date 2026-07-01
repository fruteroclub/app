"use client";

import { useTranslations } from "next-intl";

import { NAV_ITEMS } from "@/content/landing";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * MastheadNav — the masthead's primary nav (client island for active-route state).
 *
 * Route items without hashes highlight when they match the current pathname —
 * e.g. "Para empresas" → /enterprise shows a persistent 2px magenta underline
 * (the same bar the hover animation grows). usePathname() from @/i18n/navigation
 * is locale-stripped, so it matches the bare href. Home section anchors are
 * rendered through locale-aware Link so they work from non-home routes too.
 */
export function MastheadNav() {
  const t = useTranslations("landing");
  const pathname = usePathname();

  return (
    <nav className="absolute left-1/2 hidden -translate-x-1/2 justify-center gap-6 md:flex">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href.startsWith("/") &&
          !item.href.includes("#") &&
          pathname === item.href;
        return (
          <Link
            key={item.i18nKey}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative font-mono text-sm uppercase tracking-[0.06em] text-paper no-underline after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:bg-magenta after:transition-transform after:duration-[200ms] hover:after:scale-x-100 ${
              active ? "after:scale-x-100" : "after:scale-x-0"
            }`}
          >
            {t(item.i18nKey)}
          </Link>
        );
      })}
    </nav>
  );
}
