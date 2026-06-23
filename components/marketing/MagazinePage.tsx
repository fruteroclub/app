import { Glyph, type GlyphName } from "@/components/Glyph";
import type { AccentColor } from "@/content/landing";
import { ACCENT } from "./cardStyles";

/**
 * MagazinePage — one full "page" of the Lo último edition (#7).
 *
 * A newspaper-style spread (josephroche.ie reference — see DESIGN.md): a mono
 * RUNNING HEAD (collector index · TYPE·TOPIC eyebrow · time), a big Bitter
 * headline with an optional Petrona dek on the left ~2/3, and a contained,
 * hairline-framed grayscale COVER on the right ~1/3. Byline + CTA pin to the
 * bottom of the text column. Pages are stacked and separated by a heavy 2px ink
 * rule (the "clear lines between pages") when `divider` is set; this component
 * draws that top rule. Inside the MagazineTabs page-tabs it renders as the open
 * page (divider off, h-full to fill the tall band — the spread grid grows).
 *
 * Register: EDITORIAL — warm paper, FLAT, hairline rules. Server component.
 * Cover is a grayscale picsum PLACEHOLDER (`// TODO-swap` real member photos).
 */

export interface MagazinePageProps {
  /** Stable id — anchor fragment for hero-rail deep links. */
  id?: string;
  /** Collector index, shown big in the running head (e.g. "001/120"). */
  collector: string;
  /** TYPE label (muted eyebrow), e.g. "Logro". */
  category: string;
  /** Subject (accent eyebrow), e.g. "Monad". */
  topic: string;
  glyph: GlyphName;
  /** Bitter headline. */
  title: string;
  /** Petrona dek — only the lead page tends to carry one. */
  dek?: string;
  /** Mono byline (e.g. "Redacción"). */
  author: string;
  /** Mono time / edition (e.g. "HACE 5 H"). */
  time: string;
  /** One mono stat (e.g. "NIVEL 06"). */
  stat: string;
  /** Accent governs the topic eyebrow + CTA color. */
  accent: AccentColor;
  /** Stable seed for the placeholder cover photo. */
  coverSeed: string;
  /** Real cover image URL (committed next to the post). When set, renders the
   *  actual cover (full color) instead of the grayscale placeholder. */
  coverImage?: string;
  /** Alt text for a real cover image (a11y + image SEO). */
  coverAlt?: string;
  /** CTA label + href. href "#" renders a muted soon-label instead of a link. */
  cta?: { label: string; href: string; soonLabel?: string };
  /** Draw the heavy 2px top rule (the page divider). Off inside the page-tabs. */
  divider?: boolean;
  className?: string;
}

export function MagazinePage({
  id,
  collector,
  category,
  topic,
  glyph,
  title,
  dek,
  author,
  time,
  stat,
  accent,
  coverSeed,
  coverImage,
  coverAlt,
  cta,
  divider = true,
  className = "",
}: MagazinePageProps) {
  const a = ACCENT[accent];
  const isStub = !cta || cta.href === "#";

  return (
    <article
      id={id}
      className={`flex flex-col ${divider ? "border-t-2 border-ink" : ""} ${className}`}
    >
      {/* Running head — the page masthead strip */}
      <div className="flex flex-none items-center justify-between gap-4 border-b border-line py-3 font-mono text-xs uppercase tracking-[0.14em]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-bold text-ink">{collector}</span>
          <span className="hidden h-3 w-px bg-line sm:block" aria-hidden="true" />
          <span className="hidden items-center gap-1.5 text-muted-2 sm:flex">
            <Glyph name={glyph} size={11} /> {category}
          </span>
          <span className="h-3 w-px bg-line" aria-hidden="true" />
          <span className={`truncate ${a.stat}`}>{topic}</span>
        </div>
        <span className="shrink-0 text-muted-2">{time}</span>
      </div>

      {/* Spread — headline + dek + meta (left) | cover (right). flex-1 so it fills
          a tall page-tabs panel; min-h-0 lets the cover image crop rather than push. */}
      <div className="grid min-h-0 flex-1 items-stretch gap-6 py-9 md:grid-cols-[1.65fr_1fr] md:gap-10 md:py-12">
        <div className="flex min-w-0 flex-col">
          <h3 className="font-display text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink">
            {title}
          </h3>

          {dek ? (
            <p className="mt-5 max-w-prose font-serif text-lg leading-relaxed text-muted">
              {dek}
            </p>
          ) : null}

          {/* Byline + CTA pinned to the bottom of the column */}
          <div className="mt-auto flex items-end justify-between gap-4 pt-8">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-2">
              {author} <span className="text-line">·</span> {stat}
            </span>
            {isStub ? (
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-2">
                {cta?.soonLabel ?? "Pronto"}
              </span>
            ) : (
              <a
                href={cta!.href}
                className={`font-mono text-xs uppercase tracking-[0.12em] ${a.stat} hover:underline`}
              >
                {cta!.label} &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Cover — grayscale photo, hairline-framed, contained (NOT a full-bleed gradient) */}
        <div className="relative min-h-[220px] overflow-hidden border border-line bg-ink md:min-h-[300px]">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote cover from the content repo; next/image optimization is a later enhancement
            <img
              src={coverImage}
              alt={coverAlt ?? ""}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- placeholder cover until a real one is committed
            <img
              src={`https://picsum.photos/seed/${coverSeed}/640/800`}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
          )}
        </div>
      </div>
    </article>
  );
}
