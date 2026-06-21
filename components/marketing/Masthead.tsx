import Image from "next/image";
import { useTranslations } from "next-intl";

import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { SIGNUP_HREF } from "@/content/landing";
import { MastheadNav } from "./MastheadNav";

/**
 * Masthead — the consistent site header (DESIGN.md → Layout / Masthead,
 * landing.html `.masthead`/`.mh`).
 *
 * Sticky ink bar — the publication "frame" navbar (thedissolve-style: the navbar
 * shares the page frame's `--ink` color, so the dark bar reads as the top of a
 * publication frame). Logo mark (public/logo.png) + IBM Plex Mono "Frutero Club"
 * wordmark in paper, closed by a magenta signature dot · mono nav · magenta CTA.
 *
 * PAPER-ONLY (D-mode, LOCKED): NO MODO toggle on the public surface. Arcade mode
 * lives only in the authed (app) dopamine screens. Server component — static.
 */
export function Masthead() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 bg-frame text-paper">
      <div className="mx-auto grid h-20 max-w-[var(--wrap)] grid-cols-[1fr_auto] items-center gap-6 px-7 md:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image
            src="/logo.png"
            width={36}
            height={36}
            alt=""
            priority
            className="flex-none"
          />
          <span className="font-mono text-xl font-bold leading-none tracking-[-0.01em]">
            <span className="text-paper">{tc("brand.name")}</span>
            <span className="text-magenta">.</span>
          </span>
        </Link>

        <MastheadNav />

        <div className="flex items-center justify-self-end">
          {/* The shared Button at the default size (40px); onDark = magenta border
              on the ink bar, flat (arcade shadow/lift is gated to data-mode=arcade). */}
          <Button asChild onDark>
            <Link href={SIGNUP_HREF}>
              <Glyph name="bolt" size={13} /> {t("hero.ctaPrimary")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
