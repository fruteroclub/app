import { useTranslations } from "next-intl";

import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { SIGNUP_HREF, ENTERPRISE_HREF } from "@/content/landing";
import { Band } from "./Band";

/**
 * CtaBand (#10) — "UNDERGROUND" full-bleed dark closing CTA.
 *
 * Mounted inside <ArcadeSection id="cta" cabinet={false}> in page.tsx — the dark
 * token remap (--arcade-*) is handled by that wrapper. FLAT: no offset shadows,
 * no HUD, no [data-mode=arcade] here (DESIGN.md Borders/Shadows: dark marketing
 * sections stay flat; only the Leaderboard cabinet earns shadows).
 *
 * Composes:
 *   <Band>      — reusable halftone-textured centered column shell
 *   SectionHeader not used here (the band is a CLOSING climax, not an indexed
 *     section header). Instead: a small mono kicker + hairline rule sets the pace,
 *     then the BIG Bitter display heading + Geist lead body, then the two CTAs.
 *
 * Beat anatomy (top → bottom):
 *   · Mono kicker: "FRUTERO CLUB · LATAM" with magenta accent mark   [text-muted-2]
 *   · Hairline rule (1px)
 *   · Big Bitter display headline from band.title1                    [text-white]
 *   · Petrona lead paragraph from band.lead                           [text-ink (arcade-fg)]
 *   · Primary Button "Crea tu perfil" → /perfil                       [magenta]
 *   · Small secondary link "¿Eres empresa? →" → /enterprise           [text-muted-2]
 *
 * Halftone texture courtesy of <Band texture> (CSS-only dot grid, no images).
 *
 * Missing message key: band.enterprise (secondary label) is NOT in the contract.
 * Hardcoded fallback applied; TODO: add key to both locale files and switch to
 * t("band.enterprise").
 */

export function CtaBand() {
  const t = useTranslations("landing");

  // TODO: add band.enterprise to messages/{es,en}/landing.json, then switch to t("band.enterprise").
  const enterpriseLabel = "¿Eres empresa?";

  return (
    <Band>
      <div className="text-center">
        {/* ── Big closing headline — Bitter display, true white (arcade header contract) ── */}
        <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
          {t("band.title1")}
          <span className="text-magenta" aria-hidden>
            .
          </span>
        </h2>

        {/* ── Lead body — Petrona italic (editorial copy), arcade-fg = text-ink in dark remap ── */}
        <p className="mx-auto mt-6 max-w-2xl font-serif text-2xl leading-[1.5] text-ink">
          {t("band.lead")}
        </p>

        {/* ── CTAs — consistent with the hero: the shared Button at the DEFAULT (md)
              size, auto-width, primary magenta pill + secondary link (onDark on the
              dark band so the link label reads light). ── */}
        <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-2">
          <Button asChild size="md">
            <Link href={SIGNUP_HREF}>
              <Glyph name="bolt" size={13} aria-hidden />
              {t("band.cta")}
            </Link>
          </Button>

          <Button asChild variant="link" size="md" onDark>
            <Link href={ENTERPRISE_HREF}>
              {enterpriseLabel}
              <svg
                width="18"
                height="13"
                viewBox="0 0 20 14"
                fill="none"
                aria-hidden="true"
                className="text-magenta"
              >
                <path
                  d="M1 7h15M12 2l6 5-6 5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </Band>
  );
}
