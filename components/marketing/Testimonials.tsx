import { useTranslations } from "next-intl";

import { TESTIMONIALS } from "@/content/landing";

import { SectionHeader } from "./SectionHeader";
import { TestimonialCard } from "./TestimonialCard";

/**
 * Testimonials (#6) — Members' voices on a DARK flat arcade band.
 *
 * Beat position: #6 in the 11-beat landing (L L D D L **D** L D L D L).
 * Surface: dark (arcade). Mounted inside <ArcadeSection id="testimonios"> in
 * page.tsx — that wrapper owns the dark token remap (--arcade-*) and bg-paper
 * flip. `cabinet={false}` (default) — FLAT, no shadows, per DESIGN.md.
 *
 * Composition:
 *   - <SectionHeader register="arcade"> — glyph eyebrow +
 *     Bitter title (text-white) + hairline rule, via the shared primitive.
 *   - <TestimonialCard> × n — prop-driven, reusable quote-post card.
 *
 * Grid: 1 col mobile → 2 col sm → 3 col lg. Cards are equal height within
 * each row (flex column, flex-1 quote body) so the attribution strip aligns.
 *
 * Data: TESTIMONIALS from content/landing.ts (placeholder TODO-swap per plan
 * "Operator data contract" item 2 — real name/handle + rol + nivel + consent).
 * Copy keys consumed: testimonios.tag · testimonios.heading ·
 *   testimonios.items.<id>.role · testimonios.items.<id>.quote
 */
export function Testimonials() {
  const t = useTranslations("landing");

  return (
    <div className="mx-auto max-w-[var(--wrap)] px-7 py-16">
      {/* Section header — uses shared SectionHeader, arcade register */}
      <SectionHeader
        register="arcade"
        title={t("testimonios.heading")}
        className="mb-10"
      />

      {/* Quote card grid — 3 col → 1 col */}
      <ul
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {TESTIMONIALS.map((item) => (
          <li key={item.id} className="flex">
            <TestimonialCard
              name={item.name}
              role={t(item.roleKey)}
              quote={t(item.quoteKey)}
              level={item.level}
              tone={item.tone}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
