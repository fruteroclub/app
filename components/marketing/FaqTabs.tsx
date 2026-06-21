"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { FAQ_ITEMS } from "@/content/landing";

/**
 * FaqTabs (#9) — the vertical analog of the Lo último page-tabs (MagazineTabs).
 *
 * A stack of question bars; opening one eases its answer DOWN to its natural
 * height while the previously open one eases UP closed — "opening / shutting a
 * window" top-to-bottom. The vertical analog of MagazineTabs' grid-template-columns
 * animation is the grid-template-rows 0fr→1fr trick: a single-row grid whose
 * overflow-hidden child collapses to 0 and expands to content height, animatable
 * in an auto-height container (no fixed pixel heights, no JS measuring).
 *
 * Shared visual language with the tabs: the OPEN item's index sits in a black
 * square (negative margin so it never changes the bar height); ink 2px frame,
 * hairline row rules; editorial paper, FLAT. One open at a time; clicking the open
 * bar closes it (toggle). Register: Editorial.
 *
 * Copy: faq.items.<id>.{q,a} (content/landing.ts FAQ_ITEMS).
 */
export function FaqTabs() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState(0);

  return (
    <div className="border-y-2 border-ink">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = i === open;
        return (
          <div key={item.id} className={i > 0 ? "border-t border-line" : ""}>
            {/* Question bar */}
            <h3 className="m-0">
              <button
                type="button"
                id={`faq-bar-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${item.id}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="group flex w-full cursor-pointer items-center gap-4 py-5 text-left"
              >
                {/* Index — a black square when open (aligned via -my so the square
                    never changes the bar height), plain muted when closed. */}
                {isOpen ? (
                  <span className="-m-1.5 shrink-0 bg-ink p-1.5 font-mono text-xs font-bold tracking-[0.08em] text-paper">
                    {item.index}
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-xs font-bold tracking-[0.08em] text-muted-2 transition-colors group-hover:text-ink">
                    {item.index}
                  </span>
                )}

                {/* Question */}
                <span
                  className={`font-display text-base font-semibold tracking-[-0.01em] transition-colors sm:text-lg ${
                    isOpen ? "text-ink" : "text-muted group-hover:text-ink"
                  }`}
                >
                  {t(item.qKey)}
                </span>

                {/* Chevron — points down (open me) and flips up when open */}
                <span
                  aria-hidden="true"
                  className={`ml-auto shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-ink" : "text-muted-2 group-hover:text-ink"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 5l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                    />
                  </svg>
                </span>
              </button>
            </h3>

            {/* Answer — grid-template-rows 0fr↔1fr animates the height (the window). */}
            <div
              id={`faq-panel-${item.id}`}
              role="region"
              aria-labelledby={`faq-bar-${item.id}`}
              className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-[400ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-[68ch] pb-7 font-sans text-base leading-[1.65] text-muted">
                  {t(item.aKey)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
