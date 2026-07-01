"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

import { api } from "@/convex/_generated/api";
import { RARITY, type Rarity } from "@/content/landing";

import { SectionHeader } from "./SectionHeader";
import { PlayerCard } from "./PlayerCard";

/**
 * PlayerCards (#6 — the player-card deck). The trading-card mechanic (DESIGN.md)
 * as testimonial cards. Dark arcade band (inside <ArcadeSection id="testimonios">).
 *
 * Layout (2026-06-20): the deck is mounted inside an EXHIBITION FRAME (muted border
 * gallery mat) — the cards exhibited like a curated wall. An EVEN 3-col grid so the
 * rows align cleanly inside the frame (no brick offset overflowing it; the CSS-column
 * masonry was tried and reverted — it read messy). Mobile = 1 column.
 *
 * Data: public active member testimonials from Convex. While the reactive query
 * resolves, render hidden slots instead of fake members.
 */

export function PlayerCards() {
  const t = useTranslations("landing");
  const tp = useTranslations("perfil");
  const [seed] = useState(createRandomSeed);
  const liveTestimonials = useQuery(api.clubApp.getRandomTestimonials, {
    seed,
    limit: 6,
  }) as LiveTestimonial[] | undefined;
  const cards = liveTestimonials
    ? liveTestimonials.map((testimonial) =>
        liveCard(testimonial, t("players.regionFallback")),
      )
    : fallbackCards(t);

  return (
    <div className="mx-auto max-w-[var(--wrap)] px-7 py-20 md:py-28">
      <SectionHeader
        register="arcade"
        title={t("testimonios.heading")}
        rule={false}
        className="mb-10"
      />

      {/* Exhibition frame — muted gallery mat around the even player-card grid. */}
      <div className="border-2 border-muted p-6 md:p-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <PlayerCard
              key={card.id}
              name={card.name}
              role={roleLabel(card, tp)}
              quote={card.quote}
              rarity={card.rarity}
              rarityName={t(`${RARITY[card.rarity].i18nKey}.name`)}
              rarityRole={t(`${RARITY[card.rarity].i18nKey}.role`)}
              projectName={card.projectName}
              city={card.city}
              avatarSeed={card.avatarSeed}
              avatarUrl={card.avatarUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type MemberRole = "creativo" | "negocio" | "tecnologia";

interface LiveTestimonial {
  id: string;
  userId: string;
  username?: string;
  name: string;
  avatarUrl?: string;
  role?: MemberRole;
  city?: string;
  country?: string;
  githubUrl?: string;
  websiteUrl?: string;
  testimony: string;
}

interface PlayerCardData {
  id: string;
  name: string;
  role?: MemberRole;
  roleLabel?: string;
  quote: string;
  rarity: Rarity;
  projectName?: string;
  city: string;
  avatarSeed: string;
  avatarUrl?: string;
}

function fallbackCards(
  t: ReturnType<typeof useTranslations>,
): PlayerCardData[] {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `hidden-${index + 1}`,
    name: "???",
    roleLabel: t("leaderboard.hiddenRole"),
    quote: t("leaderboard.hiddenShip"),
    rarity: "common",
    projectName: t("leaderboard.lockedTier"),
    city: t("players.regionFallback"),
    avatarSeed: `hidden-${index + 1}`,
    avatarUrl: hiddenAvatarDataUrl(index),
  }));
}

function hiddenAvatarDataUrl(index: number): string {
  const accents = ["#e94fb7", "#3bbf7a", "#f08a32", "#8a8198"];
  const accent = accents[index % accents.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140"><rect width="140" height="140" fill="#f9f5ef"/><circle cx="70" cy="52" r="28" fill="${accent}"/><path d="M24 140c6-35 25-53 46-53s40 18 46 53z" fill="${accent}"/><path d="M0 0h140v140H0z" fill="none" stroke="#11091e" stroke-width="8"/><text x="70" y="78" text-anchor="middle" font-family="monospace" font-size="28" font-weight="700" fill="#11091e">???</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function roleLabel(
  card: PlayerCardData | LiveTestimonial,
  t: ReturnType<typeof useTranslations>,
): string {
  if ("roleLabel" in card && card.roleLabel) return card.roleLabel;
  if (card.role) return t(`create.roles.${card.role}`);
  return "Builder";
}

function liveCard(
  testimonial: LiveTestimonial,
  regionFallback: string,
): PlayerCardData {
  return {
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.testimony,
    rarity: "common",
    city:
      [testimonial.city, testimonial.country].filter(Boolean).join(", ") ||
      regionFallback,
    avatarSeed: testimonial.username ?? testimonial.userId,
    avatarUrl: testimonial.avatarUrl,
  };
}

function createRandomSeed(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}
