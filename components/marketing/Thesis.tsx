import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

/**
 * Thesis (#3) — the manifesto. Mounted inside <ArcadeSection id="thesis"> (dark).
 *
 * Layout (2026-06-20): an EXHIBITION FRAME (muted border, gallery mat) around the
 * manifesto + bridge — the ethos as a curated exhibit. Inside, the manifesto is a
 * magazine SHORT ARTICLE: kicker + headline on the LEFT column, body on the RIGHT,
 * on a warm-paper clipping with printer's crop-marks ("cut from a magazine").
 *
 * Below it, the BRIDGE statement: "Sube de nivel" (IBM Plex Mono, the videogame
 * register) joined by a magenta "=" to "Oportunidades Reales." (serif, the editorial
 * register). One line where it fits; stacks to three lines (each part on its own)
 * when it would overflow. On-dark text uses canon white #fffbf5 (NOT pure #fff).
 */

/** Canon LIGHT tokens — re-establish the paper register inside a dark section. */
const PAPER_CARD_VARS: CSSProperties = {
  "--paper": "#f9f5ef",
  "--surface": "#ece6dd",
  "--card": "#fffbf5",
  "--ink": "#11091e",
  "--muted": "#5b5170",
  "--muted-2": "#8a8198",
  "--line": "#dcd3c4",
  "--black": "#08000f",
} as CSSProperties;

/** Printer's crop-marks at the four corners — the "cut from a magazine" detail (§7). */
function CropMarks() {
  const base = "pointer-events-none absolute h-3 w-3 border-ink/50";
  return (
    <>
      <span aria-hidden className={`${base} -left-[3px] -top-[3px] border-l-2 border-t-2`} />
      <span aria-hidden className={`${base} -right-[3px] -top-[3px] border-r-2 border-t-2`} />
      <span aria-hidden className={`${base} -bottom-[3px] -left-[3px] border-b-2 border-l-2`} />
      <span aria-hidden className={`${base} -bottom-[3px] -right-[3px] border-b-2 border-r-2`} />
    </>
  );
}

export function Thesis() {
  const t = useTranslations("landing");

  return (
    <div className="mx-auto max-w-[var(--wrap)] px-7 py-20 md:py-28">
      {/* Exhibition frame — a MUTED-bordered "gallery" mat around the manifesto + bridge. */}
      <div className="border-2 border-muted px-6 py-12 md:px-16 md:py-20">
        {/* The manifesto as a magazine short article — headline (left) + body (right). */}
        <article
          className="relative mx-auto max-w-[860px] border-[3px] border-[var(--muted-canonical)] bg-card px-7 py-10 md:px-12 md:py-12"
          style={PAPER_CARD_VARS}
        >
          <CropMarks />
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
            {/* LEFT column — kicker + headline */}
            <div>
              <span className="block font-mono text-xs font-bold uppercase tracking-[0.2em] text-magenta">
                {t("thesis.tag")}
              </span>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.85rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink">
                {t("thesis.heading")}
              </h2>
              <div className="mt-6 h-px w-16 bg-ink" aria-hidden="true" />
            </div>
            {/* RIGHT column — body */}
            <p className="font-serif text-lg leading-[1.7] text-ink md:text-xl">
              {t("thesis.body")}
            </p>
          </div>
        </article>

        {/* Bridge — videogame (mono) ↔ editorial (serif), joined by the magenta "=".
            One row where it fits; stacks to 3 lines (Sube de nivel / = / reward) below md. */}
        <div className="mt-14 flex flex-col items-center gap-y-1.5 text-center font-semibold leading-[1.1] tracking-[-0.01em] text-[clamp(1.6rem,2.8vw,2.5rem)] md:flex-row md:justify-center md:gap-x-4">
          <span className="whitespace-nowrap font-mono text-[#fffbf5]">{t("thesis.bridgeUp")}</span>
          <span className="text-magenta">=</span>
          <span className="whitespace-nowrap font-serif text-[#fffbf5]">
            {t("thesis.bridgeReward")}
            {/* Subtle round brand dot — a small magenta circle, not a font period. */}
            <span
              aria-hidden
              className="ml-1 inline-block size-[0.18em] translate-y-[-0.02em] rounded-full bg-magenta align-baseline"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
