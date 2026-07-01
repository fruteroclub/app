"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Avatar, Button } from "@/components/ui";
import { Glyph } from "@/components/Glyph";
import { Link } from "@/i18n/navigation";
import type { MemberProfile, PreferredColor } from "@/lib/member";

const LINK_LABELS: Record<string, string> = {
  github: "GitHub",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  website: "Website",
};

/** Preferred color → the closest Avatar halftone tone (no `purple` tone yet). */
const COLOR_TO_TONE: Record<
  PreferredColor,
  "magenta" | "green" | "orange" | "muted"
> = {
  magenta: "magenta",
  violet: "muted",
  amber: "orange",
  green: "green",
};

export default function PerfilView({ profile }: { profile: MemberProfile }) {
  const t = useTranslations("perfil.view");
  const tc = useTranslations("perfil.create");
  const td = useTranslations("dashboard");
  const format = useFormatter();
  const locale = useLocale();

  // `role` is a category key (creativo/negocio/tecnologia) → show its label.
  const roleLabel = profile.role ? tc(`roles.${profile.role}`) : null;

  const links = Object.entries(profile.links).filter(
    ([, v]) => typeof v === "string" && v.length > 0,
  );

  // City + region (← profiles.country) form the place line.
  const place = [profile.city, profile.region].filter(Boolean).join(", ");
  const testimony = profile.testimony;
  const tone = profile.preferredColor
    ? COLOR_TO_TONE[profile.preferredColor]
    : "magenta";

  const memberSince = format.dateTime(new Date(profile.memberSince), {
    year: "numeric",
    month: "long",
  });

  return (
    <section className="grid gap-10">
      <header className="grid items-start gap-10 md:grid-cols-[1.55fr_0.9fr]">
        <div>
          <h1 className="mb-3 font-display text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-[1.02]">
            {profile.displayName}
          </h1>
          <div className="mt-5 flex flex-wrap gap-5 font-mono text-xs text-muted-2">
            {roleLabel ? (
              <span className="flex items-center gap-1.5">
                <Glyph name="hex" size={12} /> {tc("fields.role")}: {roleLabel}
              </span>
            ) : null}
            {place ? (
              <span className="flex items-center gap-1.5">
                <Glyph name="diamond" size={12} /> {place}
              </span>
            ) : null}
            {profile.favoriteFruit ? (
              <span className="flex items-center gap-1.5">
                <Glyph name="star" size={12} /> {profile.favoriteFruit}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Glyph name="grid" size={12} /> {t("memberSince")} {memberSince}
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="md">
              <Link href="/dashboard" locale={locale}>
                <Glyph name="star" size={14} />
                {td("linkLabel")}
              </Link>
            </Button>
            <Button asChild size="md" variant="outline">
              <Link href="/perfil/edit" locale={locale}>
                {t("edit")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative p-3.5">
          <span className="pointer-events-none absolute right-0 top-0 h-3.5 w-3.5 border-[1.5px] border-l-0 border-b-0 border-ink" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-[1.5px] border-r-0 border-t-0 border-ink" />
          <Avatar
            tone={tone}
            size={240}
            alt={profile.displayName}
            className="w-full"
            style={{ width: "100%", height: "auto", aspectRatio: "1" }}
          />
        </div>
      </header>

      {testimony ? (
        <section className="border-t-2 border-ink pt-6">
          <div className="mb-4 flex items-center gap-3">
            <Glyph name="star" size={14} style={{ color: "var(--magenta)" }} />
            <h2 className="font-display text-2xl font-semibold leading-tight">
              {t("sections.testimony")}
            </h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <blockquote className="max-w-3xl font-serif text-xl leading-[1.45] text-ink md:text-2xl">
            {testimony}
          </blockquote>
        </section>
      ) : null}

      {links.length > 0 ? (
        <div className="border-t-2 border-ink pt-6">
          <div className="mb-5 flex items-center gap-3">
            <Glyph name="grid" size={14} style={{ color: "var(--magenta)" }} />
            <h2 className="font-mono text-xs font-semibold uppercase">
              {t("sections.links")}
            </h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <ul className="grid gap-2.5 font-mono text-sm">
            {links.map(([key, value]) => (
              <li key={key} className="flex items-center gap-3">
                <span className="text-muted-2">{LINK_LABELS[key] ?? key}</span>
                <span className="text-ink">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
