'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLocale, useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { Avatar, Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import { API_ERROR_CODES } from '@/lib/api/response'
import { PREFERRED_COLORS } from '@/lib/validators/profile'
import type { Locale } from '@/i18n/routing'

/** The four canon-palette accents, in pick order. */
type PreferredColor = (typeof PREFERRED_COLORS)[number]

/** Preferred color → the canon CSS token (DESIGN.md "Canonical palette"). */
const COLOR_VAR: Record<PreferredColor, string> = {
  magenta: 'var(--magenta)',
  violet: 'var(--purple)',
  amber: 'var(--orange)',
  green: 'var(--green)',
}

/** Preferred color → the closest Avatar halftone tone (no `purple` tone yet). */
const COLOR_TO_TONE: Record<PreferredColor, 'magenta' | 'green' | 'orange' | 'muted'> = {
  magenta: 'magenta',
  violet: 'muted',
  amber: 'orange',
  green: 'green',
}

/** The profile shape the server returns (subset of the DB row). */
export interface PerfilData {
  id: string
  handle: string
  displayName: string
  role: string | null
  location: string | null
  city: string | null
  region: string | null
  favoriteFruit: string | null
  preferredColor: PreferredColor | null
  testimony: string | null
  bio: string | null
  links: Record<string, string> | null
  locale: Locale
  createdAt: string
  updatedAt: string
}

type FieldErrors = Record<string, string[] | undefined>

/**
 * The create/edit form for a perfil — the Stage-1 onboarding ("subscribe to the
 * underground publication / become a Community Member"). Shared by /perfil
 * (create) and /perfil/edit (edit).
 *
 * Two parts: the BASICS (name, handle, role, city, region, favorite fruit,
 * preferred color → a live avatar-placeholder accent) and three optional
 * "welcome bounty" cards (testimony, a GitHub project, a personal website) — each
 * an easy $PULPA win. Gets a fresh Privy token, POSTs to /api/profile, and
 * branches on the route's status codes:
 *   201/200 → navigate to the perfil view
 *   400     → inline field errors (zod.flatten().fieldErrors)
 *   409     → inline handle error ("ese handle ya existe")
 *   401     → re-auth message (the layout guard will also redirect)
 *   502/500 → a single user-visible error banner (no silent failure)
 */
export default function PerfilForm({
  initial,
  mode,
}: {
  initial?: PerfilData
  mode: 'create' | 'edit'
}) {
  const t = useTranslations('perfil.create')
  const locale = useLocale() as Locale
  const router = useRouter()
  const { getAccessToken } = usePrivy()

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [color, setColor] = useState<PreferredColor | undefined>(
    initial?.preferredColor ?? undefined,
  )

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return // double-submit guard (button is also disabled)
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    const form = new FormData(event.currentTarget)
    const links: Record<string, string> = {}
    for (const key of ['github', 'website'] as const) {
      const v = (form.get(key) as string | null)?.trim()
      if (v) links[key] = v
    }
    const str = (k: string) => ((form.get(k) as string | null) ?? '').trim()
    const payload = {
      handle: str('handle'),
      displayName: str('displayName'),
      role: str('role'),
      city: str('city'),
      region: str('region'),
      favoriteFruit: str('favoriteFruit'),
      preferredColor: color,
      testimony: str('testimony'),
      links,
      locale,
    }

    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      token = null
    }
    if (!token) {
      setFormError(t('errors.session'))
      setSubmitting(false)
      return
    }

    try {
      await apiFetch<{ profile: PerfilData }>('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      // Success (201 created / 200 updated) → show the perfil.
      router.replace('/perfil')
      router.refresh()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === API_ERROR_CODES.CONFLICT) {
          setFieldErrors({ handle: [t('errors.handleTaken')] })
        } else if (error.status === 401) {
          setFormError(t('errors.session'))
        } else if (error.code === API_ERROR_CODES.VALIDATION_ERROR) {
          const details = error.details as
            | { fieldErrors?: FieldErrors }
            | undefined
          setFieldErrors(details?.fieldErrors ?? {})
          setFormError(t('errors.validation'))
        } else {
          setFormError(error.message || t('errors.generic'))
        }
      } else {
        setFormError(t('errors.generic'))
      }
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-2xl gap-7">
      {formError ? (
        <p
          role="alert"
          className="border-2 border-black bg-card px-4 py-3 font-mono text-xs shadow-hard-sm"
          style={{ color: 'var(--red)' }}
        >
          {formError}
        </p>
      ) : null}

      {/* ── Basics ─────────────────────────────────────────────────────── */}
      <div className="grid items-start gap-6 sm:grid-cols-[auto_1fr]">
        {/* Avatar placeholder — accent follows the picked color (live). */}
        <div className="grid justify-items-center gap-2">
          <Avatar
            tone={color ? COLOR_TO_TONE[color] : 'magenta'}
            size={96}
            alt={t('fields.avatar')}
          />
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-2">
            {t('fields.avatar')}
          </span>
        </div>

        <div className="grid gap-6">
          <Field
            name="displayName"
            label={t('fields.displayName')}
            defaultValue={initial?.displayName}
            errors={fieldErrors.displayName}
            required
          />
          <Field
            name="handle"
            label={t('fields.handle')}
            hint={t('fields.handleHint')}
            defaultValue={initial?.handle}
            errors={fieldErrors.handle}
            required
            autoComplete="off"
          />
        </div>
      </div>

      <Field
        name="role"
        label={t('fields.role')}
        hint={t('fields.roleHint')}
        placeholder={t('fields.rolePlaceholder')}
        defaultValue={initial?.role ?? ''}
        errors={fieldErrors.role}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          name="city"
          label={t('fields.city')}
          placeholder={t('fields.cityPlaceholder')}
          defaultValue={initial?.city ?? ''}
          errors={fieldErrors.city}
        />
        <Field
          name="region"
          label={t('fields.region')}
          placeholder={t('fields.regionPlaceholder')}
          defaultValue={initial?.region ?? ''}
          errors={fieldErrors.region}
        />
      </div>

      <Field
        name="favoriteFruit"
        label={t('fields.favoriteFruit')}
        hint={t('fields.favoriteFruitHint')}
        placeholder={t('fields.favoriteFruitPlaceholder')}
        defaultValue={initial?.favoriteFruit ?? ''}
        errors={fieldErrors.favoriteFruit}
      />

      {/* Preferred color — four canon-palette swatches. */}
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
          {t('fields.preferredColor')}
        </legend>
        <div className="flex flex-wrap gap-3">
          {PREFERRED_COLORS.map((c) => {
            const selected = color === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(selected ? undefined : c)}
                aria-pressed={selected}
                className={`flex items-center gap-2 border-[1.5px] px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] transition-colors ${
                  selected
                    ? 'border-magenta text-ink'
                    : 'border-ink/40 text-muted-2 hover:border-ink'
                }`}
              >
                <span
                  className="inline-block h-4 w-4 border border-ink/30"
                  style={{ backgroundColor: COLOR_VAR[c] }}
                  aria-hidden="true"
                />
                {t(`fields.colors.${c}`)}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* ── Welcome bounties (optional, easy $PULPA) ───────────────────── */}
      <div className="grid gap-5 border-t-2 border-ink pt-7">
        <header className="grid gap-1.5">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
            <Glyph name="star" size={13} />
            {t('bounties.heading')}
          </p>
          <p className="max-w-prose text-sm text-muted">{t('bounties.lead')}</p>
        </header>

        <BountyCard
          title={t('bounties.testimony.title')}
          desc={t('bounties.testimony.desc')}
          reward={t('bounties.reward')}
          optional={t('bounties.optional')}
        >
          <textarea
            id="testimony"
            name="testimony"
            rows={3}
            maxLength={280}
            defaultValue={initial?.testimony ?? ''}
            placeholder={t('bounties.testimony.placeholder')}
            className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta"
          />
          <FieldError errors={fieldErrors.testimony} />
        </BountyCard>

        <BountyCard
          title={t('bounties.github.title')}
          desc={t('bounties.github.desc')}
          reward={t('bounties.reward')}
          optional={t('bounties.optional')}
        >
          <BareField
            name="github"
            label={t('fields.github')}
            placeholder={t('bounties.github.placeholder')}
            defaultValue={initial?.links?.github ?? ''}
          />
        </BountyCard>

        <BountyCard
          title={t('bounties.website.title')}
          desc={t('bounties.website.desc')}
          reward={t('bounties.reward')}
          optional={t('bounties.optional')}
        >
          <BareField
            name="website"
            label={t('fields.website')}
            placeholder={t('bounties.website.placeholder')}
            defaultValue={initial?.links?.website ?? ''}
            errors={fieldErrors.website}
          />
        </BountyCard>
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          <Glyph name="bolt" size={14} />
          {submitting
            ? mode === 'create'
              ? t('submitting')
              : t('saving')
            : mode === 'create'
              ? t('submit')
              : t('save')}
        </Button>
      </div>
    </form>
  )
}

/** A welcome-bounty card: title + reward chip + "optional" tag, then its input. */
function BountyCard({
  title,
  desc,
  reward,
  optional,
  children,
}: {
  title: string
  desc: string
  reward: string
  optional: string
  children: ReactNode
}) {
  return (
    <article className="grid gap-3 border-[1.5px] border-muted bg-black/30 p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h3>
        <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-magenta">
          {reward}
        </span>
        <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-2">
          {optional}
        </span>
      </div>
      <p className="text-sm text-muted">{desc}</p>
      <div className="grid gap-1.5">{children}</div>
    </article>
  )
}

function Field({
  name,
  label,
  hint,
  placeholder,
  defaultValue,
  errors,
  required,
  autoComplete,
}: {
  name: string
  label: string
  hint?: string
  placeholder?: string
  defaultValue?: string
  errors?: string[]
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={name}
        className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2"
      >
        {label}
        {required ? <span className="ml-1 text-magenta">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={errors && errors.length > 0 ? true : undefined}
        className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta aria-[invalid=true]:border-red"
      />
      {hint ? (
        <span className="font-mono text-xs text-muted-2">{hint}</span>
      ) : null}
      <FieldError errors={errors} />
    </div>
  )
}

/** A label-light field for inside a bounty card (the card supplies the heading). */
function BareField({
  name,
  label,
  placeholder,
  defaultValue,
  errors,
}: {
  name: string
  label: string
  placeholder?: string
  defaultValue?: string
  errors?: string[]
}) {
  return (
    <>
      <input
        id={name}
        name={name}
        type="text"
        aria-label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        aria-invalid={errors && errors.length > 0 ? true : undefined}
        className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta aria-[invalid=true]:border-red"
      />
      <FieldError errors={errors} />
    </>
  )
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null
  return (
    <span
      role="alert"
      className="font-mono text-xs"
      style={{ color: 'var(--red)' }}
    >
      {errors[0]}
    </span>
  )
}
