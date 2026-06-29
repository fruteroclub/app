import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { MastheadAuthAction } from "./MastheadAuthAction";
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
  const tc = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 bg-frame text-paper">
      <div className="relative mx-auto flex h-20 max-w-[var(--wrap)] items-center justify-between gap-6 px-7">
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

        <div className="flex items-center">
          <MastheadAuthAction />
        </div>
      </div>
    </header>
  );
}
