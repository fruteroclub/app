'use client'

import { useState, type FormEvent } from 'react'
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
  violet: 'var(--violet)',
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

/**
 * Derive a public handle from the full name (the handle is no longer
 * user-entered): strip accents, lowercase, non-alnum → hyphen, clamp to the DB
 * CHECK (`^[A-Za-z0-9_-]{3,30}$`). Falls back to `builder` for empty/short slugs;
 * the submit adds a random suffix on the rare collision.
 */
function slugifyHandle(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '')
  return slug.length >= 3 ? slug : 'builder'
}

/** The profile shape the server returns (subset of the DB row). */
export interface PerfilData {
  id: string
  handle: string
  displayName: string
  firstName: string | null
  lastName: string | null
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
    const str = (k: string) => ((form.get(k) as string | null) ?? '').trim()
    const firstName = str('firstName')
    const lastName = str('lastName')
    if (!firstName) {
      setFieldErrors({ firstName: [t('errors.nameRequired')] })
      setSubmitting(false)
      return
    }
    const displayName = [firstName, lastName].filter(Boolean).join(' ')
    // The handle is derived from the name (no longer user-entered): keep the
    // existing one on edit; slugify the name on create, adding a random suffix
    // only if the derived handle collides.
    const baseHandle = initial?.handle ?? slugifyHandle(displayName)

    const buildBody = (handle: string) => ({
      handle,
      displayName,
      firstName,
      lastName,
      role: str('role'),
      city: str('city'),
      region: str('region'),
      favoriteFruit: str('favoriteFruit'),
      preferredColor: color,
      // Bounties (testimony + links) live on the dashboard now — this form is the
      // IDENTITY profile only. Pass existing values through so editing the basics
      // never wipes them: /api/profile is a FULL upsert.
      testimony: initial?.testimony ?? undefined,
      links: initial?.links ?? undefined,
      locale,
    })

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

    // Submit, retrying with a suffixed handle if the derived one is taken
    // (create only — on edit the handle is fixed).
    let handle = baseHandle
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await apiFetch<{ profile: PerfilData }>('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(buildBody(handle)),
        })
        // Success (201 created / 200 updated) → show the perfil.
        router.replace('/perfil')
        router.refresh()
        return
      } catch (error) {
        const handleTaken =
          error instanceof ApiError &&
          error.code === API_ERROR_CODES.CONFLICT
        if (handleTaken && !initial?.handle && attempt < 3) {
          handle = `${baseHandle.slice(0, 25)}-${Math.random().toString(36).slice(2, 6)}`
          continue
        }
        if (error instanceof ApiError) {
          if (error.status === 401) {
            setFormError(t('errors.session'))
          } else if (error.code === API_ERROR_CODES.VALIDATION_ERROR) {
            const details = error.details as
              | { fieldErrors?: FieldErrors }
              | undefined
            const fe = details?.fieldErrors ?? {}
            // displayName is derived from firstName — surface its error there.
            if (fe.displayName && !fe.firstName) fe.firstName = fe.displayName
            setFieldErrors(fe)
            setFormError(t('errors.validation'))
          } else {
            setFormError(error.message || t('errors.generic'))
          }
        } else {
          setFormError(t('errors.generic'))
        }
        setSubmitting(false)
        return
      }
    }
    setFormError(t('errors.generic'))
    setSubmitting(false)
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

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            name="firstName"
            label={t('fields.firstName')}
            defaultValue={initial?.firstName ?? ''}
            errors={fieldErrors.firstName}
            required
          />
          <Field
            name="lastName"
            label={t('fields.lastName')}
            defaultValue={initial?.lastName ?? ''}
            errors={fieldErrors.lastName}
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
                className={`flex items-center gap-2.5 border-[1.5px] bg-card py-2 pl-2 pr-3.5 font-mono text-xs uppercase tracking-[0.08em] text-ink transition-colors ${
                  selected ? 'border-magenta' : 'border-frame hover:border-magenta/60'
                }`}
              >
                <span
                  className="inline-block h-8 w-8 border border-frame/30"
                  style={{ backgroundColor: COLOR_VAR[c] }}
                  aria-hidden="true"
                />
                {t(`fields.colors.${c}`)}
              </button>
            )
          })}
        </div>
      </fieldset>

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
