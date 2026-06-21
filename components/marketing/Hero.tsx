import { useTranslations } from "next-intl";

import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { ENTERPRISE_HREF, SIGNUP_HREF } from "@/content/landing";

/**
 * Hero — the media lead of the front page (left column). A large greyed photo with
 * the kicker + big Bitter "Sube de nivel." set OVER it (an ink scrim at the bottom
 * keeps the paper-colored type legible), then the Petrona subheadline + CTAs below
 * as the accompanying text. Sized to keep the subheadline + CTAs above the fold.
 *
 * Server component. The image is a PLACEHOLDER (picsum, plain <img> so it shows
 * without a config restart); swap to a curated CDMX/community photo (or the
 * member-generated art) via next/image before launch.
 */
export function Hero() {
  const t = useTranslations("landing");

  return (
    <div>
      <div className="relative border-2 border-ink">
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element -- placeholder, swap to next/image with curated photos */}
          <img
            src="https://picsum.photos/seed/frutero-cdmx-hackers/1000/667"
            alt="Builders de la comunidad Frutero en CDMX"
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <span
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/5"
            aria-hidden="true"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
          <h1 className="font-display text-[64px] font-semibold leading-[0.82] tracking-[-0.03em] text-[#fffbf5] md:text-[108px]">
            {t("hero.title1")}
            <br />
            {t("hero.title2")}
            <span className="text-magenta">.</span>
          </h1>
        </div>
      </div>

      <p className="mt-4 max-w-[46ch] font-serif text-xl leading-[1.3] text-ink md:text-2xl">
        {t.rich("hero.lead", {
          b: (chunks) => <b className="font-semibold">{chunks}</b>,
        })}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button asChild size="md">
          <Link href={SIGNUP_HREF}>
            <Glyph name="bolt" size={13} /> {t("hero.ctaPrimary")}
          </Link>
        </Button>
        <Button asChild variant="link" size="md">
          <Link href={ENTERPRISE_HREF}>{t("hero.ctaSecondary")}</Link>
        </Button>
      </div>
    </div>
  );
}
