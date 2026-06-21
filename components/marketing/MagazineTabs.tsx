"use client";

import { Fragment, useEffect, useId, useState, type KeyboardEvent } from "react";

import type { CommunityCardData } from "@/content/cards";
import { MagazinePage } from "./MagazinePage";

/**
 * MagazineTabs (#7 Lo último mechanic) — the josephroche.ie page-tabs.
 *
 * Inactive articles collapse into narrow VERTICAL SPINES (a mono index pinned at
 * the top, the article title rotated up from the bottom, thin rules between). The
 * spines before the open page pile to the LEFT, the ones after pile to the RIGHT,
 * and the open article slides into the wide panel between them — like flipping
 * through a magazine seen edge-on. A slim dark brand spine frames the far left.
 *
 * Desktop (md+) is the horizontal page-tabs. Below md the spines can't fit, so it
 * falls back to a VERTICAL disclosure accordion (stacked title bars; the open one
 * expands its page downward) — driven by the SAME active-index state.
 *
 * Register: EDITORIAL — warm paper, FLAT, hairline + 2px ink rules. The open
 * article body is a <MagazinePage> (divider off, h-full to fill the tall band).
 */

export interface MagazineTabsProps {
  posts: readonly CommunityCardData[];
  /** Read-CTA label (passed to each page). */
  readMore: string;
  /** Soon-label shown while the article backend is a stub. */
  soon: string;
  /** Vertical label on the dark brand spine (e.g. "Edición 07"). */
  brandLabel: string;
}

/** Zero-padded tab index, e.g. "01". */
const tabNo = (i: number) => String(i + 1).padStart(2, "0");

export function MagazineTabs({ posts, readMore, soon, brandLabel }: MagazineTabsProps) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  const cta = { label: readMore, href: "#", soonLabel: soon };

  // Deep-link / hero-rail open: a `#<post-id>` hash opens that page and scrolls the
  // section into view (the hero "Lo que envió la comunidad" rows link here). The id
  // is NOT an element id, so the browser does no native jump — we own the scroll,
  // landing on the section top (scroll-mt clears the sticky nav → full section).
  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!id) return;
      const idx = posts.findIndex((p) => p.id === id);
      if (idx < 0) return;
      setActive(idx);
      document
        .getElementById("lo-ultimo")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [posts]);

  /** Arrow-key navigation across the horizontal tab spines. */
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % posts.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + posts.length) % posts.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(posts.length - 1);
    }
  }

  // Grid tracks for the desktop page-tabs: a fixed edition rail, then TWO tracks
  // per post — a fixed spine and a content track that is 1fr when the post is open
  // and 0fr when collapsed. Keeping the track COUNT constant (and every content
  // track the same `minmax(0, Nfr)` form) lets grid-template-columns animate:
  // switching pages eases the old content 1fr→0fr and the new 0fr→1fr, so the two
  // share the row mid-flip — the "turning a page" feel from the reference. Fixed
  // px tracks also mean spines can never overlap (the old flex version did).
  const SPINE = "40px";
  const ACTIVE_SPINE = "40px";
  const columns: string[] = ["44px"];
  posts.forEach((_, i) => {
    columns.push(i === active ? ACTIVE_SPINE : SPINE);
    columns.push(`minmax(0, ${i === active ? 1 : 0}fr)`);
  });
  const gridTemplateColumns = columns.join(" ");

  return (
    <>
      {/* ── Desktop: horizontal page-tabs ─────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Lo último"
        onKeyDown={onKey}
        style={{ gridTemplateColumns }}
        className="hidden h-[clamp(560px,72vh,720px)] border-y-2 border-r-2 border-ink motion-safe:transition-[grid-template-columns] motion-safe:duration-[450ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] md:grid"
      >
        {/* Edition rail — the dark editorial frame on the far left */}
        <div
          aria-hidden="true"
          className="flex items-center justify-center bg-frame"
        >
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-paper [writing-mode:vertical-rl] rotate-180">
            {brandLabel}
          </span>
        </div>

        {posts.map((post, i) => {
          const isActive = i === active;
          return (
            <Fragment key={post.id}>
              {/* Spine — index top, title rotated and centered along the column */}
              <button
                type="button"
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${i}`}
                tabIndex={isActive ? 0 : -1}
                title={post.title}
                onClick={() => {
                  if (!isActive) setActive(i);
                }}
                className={`group flex h-full w-full flex-col items-center py-6 transition-colors ${
                  isActive
                    ? "cursor-default border-l border-ink bg-surface"
                    : "cursor-pointer border-l border-line hover:bg-surface/60"
                }`}
              >
                {isActive ? (
                  // Active indicator — the index at the top in a black square. The
                  // column below stays open for the action buttons (upvote/collect/…)
                  // to come; the title lives in the open page.
                  <span className="-m-1.5 bg-ink p-1.5 font-mono text-xs font-bold tracking-[0.08em] text-paper">
                    {tabNo(i)}
                  </span>
                ) : (
                  <>
                    <span className="font-mono text-xs font-bold tracking-[0.08em] text-muted-2 group-hover:text-ink">
                      {tabNo(i)}
                    </span>
                    {/* Title bottom-aligned (reads up the spine), centered across it. */}
                    <span className="flex min-h-0 flex-1 items-end justify-center">
                      <span className="max-h-full overflow-hidden whitespace-nowrap font-display text-sm font-semibold leading-snug tracking-[-0.01em] text-muted [writing-mode:vertical-rl] rotate-180 group-hover:text-ink">
                        {post.title}
                      </span>
                    </span>
                  </>
                )}
              </button>

              {/* Open page — its content track is 1fr when open, 0fr collapsed, so
                  the width animates (the page-flip). Always rendered so it can grow
                  FROM the collapsed state; overflow-hidden clips it while narrow. */}
              <div
                role="tabpanel"
                id={`${baseId}-panel-${i}`}
                aria-labelledby={`${baseId}-tab-${i}`}
                aria-hidden={!isActive}
                className={`min-w-0 overflow-hidden bg-surface ${
                  isActive ? "border-l-2 border-ink px-7" : ""
                }`}
              >
                <MagazinePage
                  collector={post.collector}
                  category={post.category}
                  topic={post.topic}
                  glyph={post.glyph}
                  title={post.title}
                  dek={post.dek}
                  author={post.author}
                  time={post.time}
                  stat={post.stat}
                  accent={post.accent}
                  coverSeed={post.id}
                  cta={cta}
                  divider={false}
                  className="h-full w-full min-w-[640px]"
                />
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* ── Mobile: vertical disclosure accordion ─────────────────────────── */}
      <div className="border-t-2 border-ink md:hidden">
        {posts.map((post, i) => {
          const isActive = i === active;
          return (
            <div key={post.id} className="border-b-2 border-ink">
              <button
                type="button"
                aria-expanded={isActive}
                aria-controls={`${baseId}-m-panel-${i}`}
                onClick={() => setActive(isActive ? -1 : i)}
                className="flex w-full items-center gap-3 py-4 text-left"
              >
                {isActive ? (
                  // Active indicator — the index in a frame-colored badge (the title is
                  // the page H1 below).
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-ink font-mono text-xs font-bold text-paper">
                    {tabNo(i)}
                  </span>
                ) : (
                  <>
                    <span className="font-mono text-xs font-bold text-muted-2">
                      {tabNo(i)}
                    </span>
                    <span className="font-display text-base font-semibold leading-snug tracking-[-0.01em] text-ink">
                      {post.title}
                    </span>
                  </>
                )}
              </button>
              {isActive ? (
                <div id={`${baseId}-m-panel-${i}`}>
                  <MagazinePage
                    collector={post.collector}
                    category={post.category}
                    topic={post.topic}
                    glyph={post.glyph}
                    title={post.title}
                    dek={post.dek}
                    author={post.author}
                    time={post.time}
                    stat={post.stat}
                    accent={post.accent}
                    coverSeed={post.id}
                    cta={cta}
                    divider={false}
                    className="pb-4"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
