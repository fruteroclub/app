"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { CommunityCardData } from "@/content/cards";

import { CommunityCard } from "./CommunityCard";

/**
 * CommunityDeck — the hero's living deck of community trading cards.
 *
 * The cards stack on top of each other like a physical hand (depth-based offset,
 * rotation, scale). Every {@link INTERVAL_MS} the front card is "played": it
 * flies off and recycles to the back while the next rises to the front. Hover (or
 * focus) pauses; click / Enter / Space deals the next card.
 *
 * Accessibility: `prefers-reduced-motion` disables both the autoplay and the
 * transitions (a static fanned stack remains, advancing snaps instead of
 * animating). Only the front card is exposed to assistive tech.
 *
 * Client island on the otherwise-static marketing page (hydrates in place).
 */

const INTERVAL_MS = 3400;
const DEAL_MS = 480;
const VISIBLE = 4; // depths 0..3 are drawn; deeper cards wait hidden behind

/** Resting transform for a card at a given depth in the stack (0 = front). */
function restingStyle(depth: number): { transform: string; opacity: number; z: number } {
  const steps = [
    { y: 0, x: 0, r: 0, s: 1, o: 1 },
    { y: 16, x: 12, r: 2, s: 0.965, o: 1 },
    { y: 32, x: 22, r: 3.5, s: 0.93, o: 0.9 },
    { y: 46, x: 30, r: 5, s: 0.9, o: 0.5 },
  ];
  const st = steps[Math.min(depth, steps.length - 1)];
  return {
    transform: `translate(${st.x}px, ${st.y}px) rotate(${st.r}deg) scale(${st.s})`,
    opacity: depth >= VISIBLE ? 0 : st.o,
    z: 100 - depth,
  };
}

const FLY_OFF = "translate(150%, -8%) rotate(9deg) scale(0.95)";

export function CommunityDeck({
  cards,
  label,
  edition,
}: {
  cards: readonly CommunityCardData[];
  label: string;
  edition: string;
}) {
  const n = cards.length;
  const [active, setActive] = useState(0);
  const [dealing, setDealing] = useState(false);
  const [paused, setPaused] = useState(false);
  // Assume reduced until mounted: no motion on first paint, motion enabled only
  // for users who haven't asked to reduce it (avoids a hydration motion flash).
  const [reduced, setReduced] = useState(true);
  const dealingRef = useRef(false);

  useEffect(() => {
    // No matchMedia (SSR / jsdom) => keep `reduced` true: static, no autoplay.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const advance = useCallback(() => {
    if (n < 2 || dealingRef.current) return;
    if (reduced) {
      setActive((a) => (a + 1) % n);
      return;
    }
    dealingRef.current = true;
    setDealing(true);
    window.setTimeout(() => {
      setActive((a) => (a + 1) % n);
      setDealing(false);
      dealingRef.current = false;
    }, DEAL_MS);
  }, [n, reduced]);

  useEffect(() => {
    if (reduced || paused || n < 2) return;
    const id = window.setInterval(advance, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused, advance, n]);

  // While dealing, the rest of the stack pre-shifts to where it lands.
  const base = dealing ? (active + 1) % n : active;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink">
          <span className="inline-block h-2 w-2 bg-magenta" aria-hidden="true" />
          {label}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
          {edition}
        </span>
      </div>

      <div
        className="group relative mx-auto h-[460px] w-full max-w-[400px] cursor-pointer select-none"
        role="button"
        tabIndex={0}
        aria-label={`${label}. Carta ${active + 1} de ${n}. Avanzar.`}
        onClick={advance}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            advance();
          }
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {cards.map((card, i) => {
          const isFlying = dealing && i === active;
          const depth = (i - base + n) % n;
          const rest = restingStyle(depth);
          const style: CSSProperties = isFlying
            ? { transform: FLY_OFF, opacity: 0, zIndex: 200 }
            : { transform: rest.transform, opacity: rest.opacity, zIndex: rest.z };
          return (
            <div
              key={card.id}
              aria-hidden={depth !== 0 || undefined}
              className={`absolute inset-x-0 top-0 mx-auto h-[400px] w-full max-w-[360px] ${
                reduced
                  ? ""
                  : "transition-[transform,opacity] duration-[480ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]"
              }`}
              style={style}
            >
              <CommunityCard card={card} seed={i} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-muted-2">
        <span className="text-ink">
          {String(active + 1).padStart(2, "0")}
          <span className="text-muted-2"> / {String(n).padStart(2, "0")}</span>
        </span>
        <span className="opacity-0 transition-opacity group-hover:opacity-100">
          Toca para jugar la siguiente
        </span>
      </div>
    </div>
  );
}
