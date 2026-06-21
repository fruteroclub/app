"use client";

import { useTranslations } from "next-intl";

import { NAV_ITEMS } from "@/content/landing";
import { usePathname } from "@/i18n/navigation";

/**
 * MastheadNav — the masthead's primary nav (client island for active-route state).
 *
 * Route items (href starting with "/") highlight when they match the current
 * pathname — e.g. "Para empresas" → /enterprise shows a persistent 2px magenta
 * underline (the same bar the hover animation grows). usePathname() from
 * @/i18n/navigation is locale-stripped, so it matches the bare href. In-page
 * anchors (#…) aren't route-active (scroll-spy is not in scope).
 */
export function MastheadNav() {
  const t = useTranslations("landing");
  const pathname = usePathname();

  return (
    <nav className="hidden justify-center gap-6 md:flex">
      {NAV_ITEMS.map((item) => {
        const active = item.href.startsWith("/") && pathname === item.href;
        return (
          <a
            key={item.i18nKey}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative font-mono text-sm uppercase tracking-[0.06em] text-paper no-underline after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:bg-magenta after:transition-transform after:duration-[200ms] hover:after:scale-x-100 ${
              active ? "after:scale-x-100" : "after:scale-x-0"
            }`}
          >
            {t(item.i18nKey)}
          </a>
        );
      })}
    </nav>
  );
}
