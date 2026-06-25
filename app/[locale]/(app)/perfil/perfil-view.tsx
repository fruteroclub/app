'use client'

import { useFormatter, useLocale, useTranslations } from 'next-intl'

import { Avatar, Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { Link } from '@/i18n/navigation'
import { ROLE_CATEGORIES, type PerfilData } from './perfil-form'

/**
 * The perfil view — a 1:1 translation of the FEATURE HEADER from
 * docs/design/previews/twin-profile.html, restricted to the OFF-CHAIN fields
 * that exist in the v0.5 schema.
 *
 * SCOPE GUARD (Hard rule #4 + schema scope guard): the preview's reputation /
 * level / XP meter / "desbloquea lo siguiente" unlocks are ONCHAIN product-plan
 * surfaces — `token_id`, `level`, `score` are deliberately ABSENT from the data
 * model. They are intentionally NOT rendered here. This is the identity
 * foundation the product plan layers reputation on top of later.
 *
 * Rendered inside the authed (app) group, so it sits in arcade-dark mode.
 */
const LINK_LABELS: Record<string, string> = {
  github: 'GitHub',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  website: 'Website',
}

/** Preferred color → the closest Avatar halftone tone (no `purple` tone yet). */
const COLOR_TO_TONE: Record<
  NonNullable<PerfilData['preferredColor']>,
  'magenta' | 'green' | 'orange' | 'muted'
> = {
  magenta: 'magenta',
  violet: 'muted',
  amber: 'orange',
  green: 'green',
}

export default function PerfilView({ profile }: { profile: PerfilData }) {
  const t = useTranslations('perfil.view')
  const tc = useTranslations('perfil.create')
  const td = useTranslations('dashboard')
  const format = useFormatter()
  const locale = useLocale()

  // `role` stores a category key (creativo/negocio/tecnologia) → show its label;
  // fall back to the raw value for any legacy free-text role.
  const roleLabel =
    profile.role &&
    (ROLE_CATEGORIES as readonly string[]).includes(profile.role)
      ? tc(`roles.${profile.role}`)
      : profile.role

  const links = Object.entries(profile.links ?? {}).filter(
    ([, v]) => typeof v === 'string' && v.length > 0,
  )

  // City + region replace the legacy single `location`; fall back to it.
  const place =
    [profile.city, profile.region].filter(Boolean).join(', ') ||
    profile.location
  // The onboarding "testimony" is the headline bio; legacy rows fall back to bio.
  const testimony = profile.testimony ?? profile.bio
  const tone = profile.preferredColor
    ? COLOR_TO_TONE[profile.preferredColor]
    : 'magenta'

  const memberSince = format.dateTime(new Date(profile.createdAt), {
    year: 'numeric',
    month: 'long',
  })

  return (
    <section className="grid gap-10">
      {/* feature header (twin-profile.html .feature) */}
      <header className="grid items-start gap-10 md:grid-cols-[1.55fr_0.9fr]">
        <div>
          <p className="flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
            <Glyph name="target" size={13} />
            {t('kicker')}
            <span className="h-px flex-1 bg-line" />
          </p>
          <h1 className="mt-4 mb-3 font-display text-[clamp(2.75rem,7vw,4rem)] font-semibold leading-[0.98] tracking-[-0.025em]">
            {profile.displayName}
          </h1>
          {roleLabel ? (
            <p className="max-w-[46ch] text-lg leading-[1.45] text-muted">
              <b className="font-semibold text-ink">{roleLabel}.</b>
              {testimony ? ` ${testimony}` : ''}
            </p>
          ) : testimony ? (
            <p className="max-w-[46ch] text-lg leading-[1.45] text-muted">
              {testimony}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-5 font-mono text-xs uppercase tracking-[0.06em] text-muted-2">
            <span className="flex items-center gap-1.5">
              <Glyph name="hex" size={12} /> @{profile.handle}
            </span>
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
              <Glyph name="grid" size={12} /> {t('memberSince')} {memberSince}
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="md">
              <Link href="/dashboard" locale={locale}>
                <Glyph name="star" size={14} />
                {td('linkLabel')}
              </Link>
            </Button>
            <Button asChild size="md" variant="outline">
              <Link href="/perfil/edit" locale={locale}>
                {t('edit')}
              </Link>
            </Button>
          </div>
        </div>

        {/* portrait with crop marks (twin-profile.html .portrait) */}
        <div className="relative p-3.5">
          <span className="pointer-events-none absolute right-0 top-0 h-3.5 w-3.5 border-[1.5px] border-l-0 border-b-0 border-ink" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-[1.5px] border-r-0 border-t-0 border-ink" />
          <Avatar
            tone={tone}
            size={240}
            alt={profile.displayName}
            className="w-full"
            style={{ width: '100%', height: 'auto', aspectRatio: '1' }}
          />
        </div>
      </header>

      {/* links (off-chain) */}
      {links.length > 0 ? (
        <div className="border-t-2 border-ink pt-6">
          <div className="mb-5 flex items-center gap-3">
            <Glyph name="grid" size={14} style={{ color: 'var(--magenta)' }} />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
              {t('sections.links')}
            </h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <ul className="grid gap-2.5 font-mono text-sm">
            {links.map(([key, value]) => (
              <li key={key} className="flex items-center gap-3">
                <span className="text-muted-2">
                  {LINK_LABELS[key] ?? key}
                </span>
                <span className="text-ink">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
