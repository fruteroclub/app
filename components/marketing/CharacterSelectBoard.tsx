"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Glyph } from "@/components/Glyph";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { RARITY, type AccentColor, type Rarity } from "@/content/landing";

/**
 * CharacterSelectBoard — the Leaderboard #8 cabinet as a videogame screen.
 *
 * ALWAYS 2 columns, in a FIXED-height band so the frame never resizes. RIGHT (1/3) =
 * the leaderboard, ALWAYS visible and CONSISTENT (no transition — the persistent nav).
 * LEFT (2/3) is the "screen": two states —
 *   - BROWSE (first view): the 6-card ROSTER GRID. Arcade ATTRACT MODE auto-cycles a
 *     highlight down the cards + the synced leaderboard row (blinking `▶`), inviting a
 *     pick; hover points + pauses, click opens.
 *   - OPEN: the picked builder's profile.
 * The transition between LEFT views is a videogame **clear → load**: the current view
 * CLEARS off (fades to the dark screen), then the new view LOADS in top-to-bottom (a
 * scanline draw). Only the LEFT view animates — the leaderboard + the container hold.
 *
 * Identity: editorial-riso, FLAT (no shadows). Borders = the MUTED line; magenta is
 * punctuation. Respects `prefers-reduced-motion`.
 *
 * TOKEN CONTRACT — the cabinet INVERTS neutrals: bg-frame/bg-black/bg-purple = DARK;
 * text-ink (→ #f9f5ef)/text-white = LIGHT; text-muted (→ #b3a9c9) = secondary;
 * border-muted = the soft hairline. NEVER `bg-ink`/`text-paper` here.
 */

export interface RosterEntry {
  id: string;
  name: string;
  acronym: string;
  role: string;
  rarity: Rarity;
  rarityName: string;
  rarityRole: string;
  pulpa: number;
  ships: readonly string[];
  accent: AccentColor;
  href: string;
}

export interface CharacterSelectLabels {
  headerTitle: string;
  headerTag: string;
  pulpaLabel: string;
  weekLabel: string;
  back: string;
  prompt: string;
  insert: string;
  highScore: string;
  periodWeek: string;
  periodQuarter: string;
  periodYear: string;
  construye: string;
  agentCta: string;
  rosterTitle: string;
  footer: string;
}

/** The all-time $PULPA record holder, shown on the insert-coin bar (rarity + acronym + score). */
export interface RecordEntry {
  acronym: string;
  rarity: Rarity;
  pulpa: number;
}

const ACCENT_VAR: Record<AccentColor, string> = {
  magenta: "var(--magenta)",
  green: "var(--green)",
  orange: "var(--orange)",
  muted: "var(--muted-canonical)",
};

const fmtPulpa = (n: number) => n.toLocaleString("en-US");
const rankNo = (i: number) => String(i + 1).padStart(2, "0");

/** Arcade edition code W{ISO week}Q{quarter}Y{2-digit year}, e.g. "W25Q2Y26". */
function editionCode(d: Date): string {
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  const yy = String(d.getFullYear() % 100).padStart(2, "0");
  // ISO 8601 week number.
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `W${String(week).padStart(2, "0")}Q${quarter}Y${yy}`;
}
const ATTRACT_MS = 1700;
const CLEAR_MS = 150;
const LOAD_MS = 280;

type Phase = "idle" | "out" | "in";

/** Rarity tier symbol. `tone`: "ink" (light, on dark) | "frame" (dark, on the light strip). */
function RaritySymbol({
  rarity,
  size = 12,
  tone = "ink",
}: {
  rarity: Rarity;
  size?: number;
  tone?: "ink" | "frame";
}) {
  const { symbol } = RARITY[rarity];
  const dotBg = tone === "frame" ? "bg-frame" : "bg-ink";
  const glyphColor = tone === "frame" ? "text-frame" : "text-ink";
  if (symbol === "dot") {
    return (
      <span
        className={`inline-block shrink-0 rounded-full ${dotBg}`}
        style={{ width: size - 4, height: size - 4 }}
        aria-hidden="true"
      />
    );
  }
  return <Glyph name={symbol} size={size} className={`shrink-0 ${glyphColor}`} aria-hidden />;
}

/** Risograph portrait — a two-ink PRINT (cream stock, photo as dark ink, faint accent, halftone). */
function RisoPortrait({ entry }: { entry: RosterEntry }) {
  return (
    <>
      <span aria-hidden className="absolute inset-0 bg-[#efe6d6]" />
      {/* eslint-disable-next-line @next/next/no-img-element -- placeholder portrait, swap for member card art */}
      <img
        src={`https://picsum.photos/seed/${entry.id}/420/520`}
        alt={entry.name}
        className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.7] brightness-105 mix-blend-multiply"
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.18] mix-blend-multiply"
        style={{ backgroundColor: ACCENT_VAR[entry.accent] }}
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-60 mix-blend-multiply"
        style={{
          backgroundImage: "radial-gradient(var(--frame) 38%, transparent 40%)",
          backgroundSize: "5px 5px",
        }}
      />
    </>
  );
}

function PortraitOverlays({ entry, rank }: { entry: RosterEntry; rank: string }) {
  return (
    <>
      <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-[0.08em] text-frame">
        {rank}
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-ink/90 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-frame">
        <RaritySymbol rarity={entry.rarity} size={10} tone="frame" />
        {entry.rarityName}
      </span>
    </>
  );
}

export function CharacterSelectBoard({
  roster,
  record,
  labels,
}: {
  roster: readonly RosterEntry[];
  record: RecordEntry;
  labels: CharacterSelectLabels;
}) {
  const [open, setOpen] = useState<number | null>(null); // the DISPLAYED view (null = grid)
  const [cursor, setCursor] = useState(0); // attract-mode highlight while browsing
  const [phase, setPhase] = useState<Phase>("idle"); // clear → load transition phase
  const pendingRef = useRef<number | null>(null);
  const hoverRef = useRef(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // Attract loop — only while browsing, idle, motion allowed, not hovering.
  useEffect(() => {
    if (open !== null || reduced || phase !== "idle") return;
    const id = window.setInterval(() => {
      if (!hoverRef.current) setCursor((c) => (c + 1) % roster.length);
    }, ATTRACT_MS);
    return () => window.clearInterval(id);
  }, [open, reduced, phase, roster.length]);

  // Drive the clear → load phases. Content swaps while the screen is cleared.
  useEffect(() => {
    if (phase === "out") {
      const t = window.setTimeout(() => {
        setOpen(pendingRef.current);
        setPhase("in");
      }, CLEAR_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "in") {
      const t = window.setTimeout(() => setPhase("idle"), LOAD_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  /** Transition to a view (a builder index, or null for the roster grid). */
  function go(target: number | null) {
    if (target === open && phase === "idle") return;
    if (reduced) {
      setOpen(target);
      return;
    }
    pendingRef.current = target;
    setPhase("out");
  }

  const isOpen = open !== null;
  const highlight = open ?? cursor; // which builder the leaderboard marks
  const sel = roster[highlight];
  const edition = editionCode(new Date()); // W##Q#Y## marquee edition code



  function point(i: number) {
    hoverRef.current = true;
    setCursor(i);
  }
  function release() {
    hoverRef.current = false;
  }

  function onNavKey(e: KeyboardEvent<HTMLDivElement>) {
    const next = (d: number) => (highlight + d + roster.length) % roster.length;
    function move(d: number) {
      if (isOpen) go(next(d));
      else setCursor(next(d));
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go(highlight);
    }
  }

  const viewAnim =
    phase === "out"
      ? "motion-safe:[animation:view-clear_150ms_ease-in_forwards]"
      : phase === "in"
        ? "motion-safe:[animation:view-load_280ms_cubic-bezier(0.22,1,0.36,1)]"
        : "";

  return (
    <div className="border-2 border-muted">
      {/* MARQUEE — the arcade cabinet's title plate ($PULPA) on a black bezel: the
          Frutero logo + $PULPA in IBM Plex Mono, one tier below the hero H1. The mode
          (browse prompt / back) + the edition flank it like credit text. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-muted bg-black px-4 py-4 md:py-6">
        <div className="min-w-0 justify-self-start">
          {isOpen ? (
            <button
              type="button"
              onClick={() => go(null)}
              className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-magenta"
            >
              <span aria-hidden className="shrink-0">
                ←
              </span>
              <span className="truncate">{labels.back}</span>
            </button>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">
              <span
                aria-hidden
                className="shrink-0 text-magenta motion-safe:[animation:attract-blink_1.2s_steps(1,end)_infinite]"
              >
                ▶
              </span>
              <span className="truncate">{labels.prompt}</span>
            </span>
          )}
        </div>
        <span className="justify-self-center font-mono text-3xl font-bold leading-none tracking-[-0.02em] text-white md:text-6xl">
          <span className="text-magenta">$</span>PULPA
        </span>
        <span
          suppressHydrationWarning
          className="hidden justify-self-end truncate text-right font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted sm:block"
        >
          {edition}
        </span>
      </div>

      {/* Always 2 columns in a FIXED-height band — the frame never resizes. */}
      <div className="grid bg-frame md:h-[clamp(520px,64vh,640px)] md:grid-cols-[2fr_1fr] md:overflow-hidden">
        {/* ── LEFT 2/3: the "screen" that clears + loads on change ── */}
        <div className={`md:h-full md:overflow-hidden ${viewAnim}`}>
          {isOpen ? (
            /* OPEN: the builder profile */
            <div className="flex h-full flex-col gap-6 p-6 sm:flex-row md:items-center md:p-8">
              <div className="relative aspect-[4/5] w-full shrink-0 self-start overflow-hidden border-2 border-muted sm:w-[200px]">
                <RisoPortrait entry={sel} />
                <PortraitOverlays entry={sel} rank={rankNo(highlight)} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-magenta">
                  {sel.acronym}
                </span>
                <p className="mt-1 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-white">
                  {sel.name}
                </p>
                <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                  {sel.role}
                </p>
                <span className="mt-2.5 inline-flex w-fit items-center gap-1.5">
                  <RaritySymbol rarity={sel.rarity} size={13} />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
                    {sel.rarityRole}
                  </span>
                </span>
                <div className="mt-5 flex items-baseline gap-2 border-t border-muted pt-4">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.pulpaLabel} · {labels.weekLabel}
                  </span>
                  <span className="font-mono text-3xl font-bold tabular-nums leading-none text-magenta">
                    {fmtPulpa(sel.pulpa)}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.construye}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-2">
                    {sel.ships.map((ship) => (
                      <span
                        key={ship}
                        className="inline-flex items-center gap-1.5 border border-muted px-2.5 py-1 font-mono text-xs uppercase tracking-[0.06em] text-ink"
                      >
                        <Glyph name="bolt" size={11} className="text-ink/70" aria-hidden />
                        {ship}
                      </span>
                    ))}
                  </span>
                </div>
                <Button asChild onDark className="mt-6 self-start">
                  <Link href={sel.href}>{labels.agentCta}</Link>
                </Button>
              </div>
            </div>
          ) : (
            /* BROWSE: the roster grid (fills the band; attract cursor highlights one) */
            <div
              aria-label={labels.rosterTitle}
              className="grid h-full grid-cols-2 gap-3 p-4 md:grid-cols-3 md:grid-rows-2 md:gap-4 md:p-5"
            >
              {roster.map((p, i) => {
                const isHL = i === cursor;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => go(i)}
                    onMouseEnter={() => point(i)}
                    onMouseLeave={release}
                    onFocus={() => point(i)}
                    onBlur={release}
                    aria-label={`${p.name} — ${labels.pulpaLabel} ${fmtPulpa(p.pulpa)}`}
                    className={`group flex flex-col border-2 text-left transition-colors md:h-full ${
                      isHL ? "border-magenta" : "border-muted hover:border-ink"
                    }`}
                  >
                    <div className="relative aspect-[5/4] w-full overflow-hidden md:aspect-auto md:min-h-0 md:flex-1">
                      <RisoPortrait entry={p} />
                      <PortraitOverlays entry={p} rank={rankNo(i)} />
                      {isHL ? (
                        <span className="absolute bottom-1 right-1 font-mono text-[11px] font-bold leading-none text-magenta motion-safe:[animation:attract-blink_1.2s_steps(1,end)_infinite]">
                          ▶
                        </span>
                      ) : null}
                    </div>
                    <div
                      className={`flex items-center justify-between gap-2 border-t-2 px-3 py-2 transition-colors ${
                        isHL ? "border-magenta bg-purple" : "border-muted bg-frame"
                      }`}
                    >
                      <span className="font-mono text-lg font-bold uppercase tracking-[0.12em] text-white">
                        {p.acronym}
                      </span>
                      <span
                        className={`font-mono text-base font-bold tabular-nums ${
                          isHL || i === 0 ? "text-magenta" : "text-ink"
                        }`}
                      >
                        {fmtPulpa(p.pulpa)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT 1/3: the leaderboard — ALWAYS visible + CONSISTENT (no transition) ── */}
        <div className="flex flex-col border-t border-muted bg-frame md:border-l md:border-t-0">
          <div className="border-b border-muted px-4 py-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              {labels.rosterTitle}
            </span>
          </div>
          <div
            role="listbox"
            aria-label={labels.rosterTitle}
            tabIndex={0}
            onKeyDown={onNavKey}
            className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-magenta"
          >
            {roster.map((p, i) => {
              const isHL = i === highlight;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={isHL}
                  onClick={() => go(i)}
                  onMouseEnter={() => !isOpen && point(i)}
                  onMouseLeave={() => !isOpen && release()}
                  className={`grid w-full flex-1 grid-cols-[26px_1fr_auto] items-center gap-2.5 border-b border-muted/40 border-l-[3px] px-4 py-3 text-left transition-colors last:border-b-0 ${
                    isHL
                      ? `border-l-magenta pl-[calc(1rem-3px)] ${isOpen ? "bg-purple" : "bg-white/[0.05]"}`
                      : "border-l-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`px-1 py-0.5 font-mono text-xs font-bold tabular-nums ${
                      isHL ? "bg-ink text-frame" : "text-muted"
                    }`}
                  >
                    {rankNo(i)}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <RaritySymbol rarity={p.rarity} size={11} />
                    <span className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-white">
                      {p.acronym}
                    </span>
                  </span>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      isHL ? "text-magenta" : "text-ink"
                    }`}
                  >
                    {fmtPulpa(p.pulpa)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* INSERT-COIN BAR — arcade bottom screen (black bezel): INSERT $PULPA (blink,
          bottom-left) · period selector (center) · the all-time RÉCORD (bottom-right,
          formatted like a leaderboard entry: rarity glyph + acronym + score). */}
      <div className="flex items-center justify-between gap-3 border-t border-muted bg-black px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
          <span
            aria-hidden
            className="text-magenta motion-safe:[animation:attract-blink_1.2s_steps(1,end)_infinite]"
          >
            ▸
          </span>
          {labels.insert}
        </span>
        <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] md:flex">
          <span className="font-bold text-magenta">{labels.periodWeek}</span>
          <span aria-hidden className="text-muted/50">·</span>
          <span className="text-muted">{labels.periodQuarter}</span>
          <span aria-hidden className="text-muted/50">·</span>
          <span className="text-muted">{labels.periodYear}</span>
        </span>
        <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          {labels.highScore}
          <RaritySymbol rarity={record.rarity} size={12} />
          <span className="text-white">{record.acronym}</span>
          <span className="tabular-nums text-magenta">{fmtPulpa(record.pulpa)}</span>
        </span>
      </div>
    </div>
  );
}
