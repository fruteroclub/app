import { useTranslations } from "next-intl";

import type { CommunityCardData } from "@/content/cards";
import { SectionHeader } from "./SectionHeader";
import { MagazineTabs } from "./MagazineTabs";

/**
 * LatestMagazine (#7) — Lo último. The community's latest dispatches as a
 * josephroche.ie page-tabs reader (see DESIGN.md): inactive articles collapse to
 * vertical title spines; clicking one slides its full page open between them.
 * Light EDITORIAL beat (warm paper, FLAT, hairline + 2px ink rules); mounted in
 * the editorial column in page.tsx (NOT an arcade band).
 *
 * Source of truth (T4): the REAL latest articles — `latest(6, lang)` from
 * `lib/content/articles`, fetched in page.tsx and passed in as `posts` (mapped to
 * `CommunityCardData` via `lib/content/present`). The hero front-page rail lists
 * the SAME dispatches (its first 4). Each page's read CTA now links to the real
 * `/noticias/<slug>` route (no more "#" stub). Zero posts → the "pronto" empty state.
 *
 * Layout: a newspaper nameplate (Bitter title + a mono edition strip framed by 2px
 * ink rules), then the <MagazineTabs> band. The tabs hold the client state; this
 * stays a server component and just hands down the localized CTA labels + hrefs.
 */
export interface LatestMagazineProps {
  /** Latest posts (mapped from ArticleMeta), newest first. */
  posts: readonly CommunityCardData[];
  /** Locale prefix for the article hrefs ('' for the ES apex, '/en' for EN). */
  localePrefix: string;
}

export function LatestMagazine({ posts, localePrefix }: LatestMagazineProps) {
  const t = useTranslations("landing");

  const ctaHrefBySlug = Object.fromEntries(
    posts.map((p) => [p.id, `${localePrefix}/noticias/${p.id}`]),
  );

  return (
    <section id="lo-ultimo" className="scroll-mt-24 pb-20 md:pb-28">
      {/* Nameplate — section title */}
      <SectionHeader
        register="editorial"
        title={t("latest.heading")}
        rule={false}
        className="px-0 pb-4 pt-20 md:pt-28"
      />

      {/* Edition strip — masthead band (2px top rule; the tabs band caps the
          bottom), so the mono line reads as a newspaper nameplate. */}
      <div className="flex items-center justify-between gap-4 border-t-2 border-ink py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-muted-2">
        <span>Edición 07 &middot; Lo que envió la comunidad</span>
        <span className="shrink-0">{posts.length} páginas</span>
      </div>

      {posts.length === 0 ? (
        <div className="border-t-2 border-ink py-20 text-center font-serif text-lg text-muted">
          {t("latest.empty")}
        </div>
      ) : (
        // The page-tabs reader (client). Each read CTA links to /noticias/<slug>.
        <MagazineTabs
          posts={posts}
          readMore={t("latest.readMore")}
          soon={t("latest.soon")}
          brandLabel="Edición 07"
          ctaHrefBySlug={ctaHrefBySlug}
        />
      )}
    </section>
  );
}
