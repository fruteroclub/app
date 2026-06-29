'use client'

import { useState, type FormEvent } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useMutation } from 'convex/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { Avatar, Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { api } from '@/convex/_generated/api'
import {
  MEMBER_ROLES as ROLE_CATEGORIES,
  PREFERRED_COLORS,
  pickWallets,
  slugifyHandle,
  type MemberProfile,
  type MemberRole,
  type PreferredColor,
} from '@/lib/member'

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
 * Expressive line icons for the role selector (representational, unlike the
 * abstract geometric Glyph set): an artist palette (Creativo), a handshake
 * (Negocio), and a gear (Tecnología).
 */
function RoleIcon({ role }: { role: MemberRole }) {
  const svg = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (role === 'creativo') {
    return (
      <svg {...svg}>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h1.99c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2Z" />
        <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="13.5" cy="6.8" r="1" fill="currentColor" stroke="none" />
        <circle cx="17.3" cy="10.3" r="1" fill="currentColor" stroke="none" />
        <circle cx="6.8" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (role === 'negocio') {
    return (
      <svg {...svg}>
        <path d="m11 17 2 2a1 1 0 1 0 3-3" />
        <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
        <path d="m21 3 1 11h-2" />
        <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
        <path d="M3 4h8" />
      </svg>
    )
  }
  return (
    <svg {...svg}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

type FieldErrors = Record<string, string[] | undefined>

/**
 * The create/edit IDENTITY form — Stage-1 onboarding. Shared by /perfil (create)
 * and /perfil/edit (edit). Writes the member's account + profile to Convex via
 * `api.clubApp.saveProfile` (identity only — the welcome bounties live on the
 * dashboard). The Privy DID + wallet addresses come straight from `usePrivy`; the
 * handle is derived from the name. All fields required (client-validated).
 */
export default function PerfilForm({
  initial,
  mode,
}: {
  initial?: MemberProfile
  mode: 'create' | 'edit'
}) {
  const t = useTranslations('perfil.create')
  const router = useRouter()
  const { user } = usePrivy()
  const saveProfile = useMutation(api.clubApp.saveProfile)

  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [color, setColor] = useState<PreferredColor | undefined>(
    initial?.preferredColor ?? undefined,
  )
  const [role, setRole] = useState<MemberRole | undefined>(
    initial?.role ?? undefined,
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
    const city = str('city')
    const region = str('region')
    const favoriteFruit = str('favoriteFruit')

    // Everything is required (the profile is the member's identity card).
    const missing: FieldErrors = {}
    const req = (k: string, v: string) => {
      if (!v) missing[k] = [t('errors.required')]
    }
    req('firstName', firstName)
    req('lastName', lastName)
    req('city', city)
    req('region', region)
    req('favoriteFruit', favoriteFruit)
    if (!role) missing.role = [t('errors.required')]
    if (!color) missing.preferredColor = [t('errors.required')]
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing)
      setSubmitting(false)
      return
    }

    if (!user?.id) {
      setFormError(t('errors.session'))
      setSubmitting(false)
      return
    }

    // The handle is derived from the name (not user-entered): keep the existing
    // one on edit, else slugify. The two wallet addresses come from Privy.
    const displayName = [firstName, lastName].filter(Boolean).join(' ')
    const username = initial?.handle || slugifyHandle(displayName)
    const { appWallet, userWallet } = pickWallets(user)

    try {
      await saveProfile({
        privyDid: user.id,
        email: user.email?.address ?? undefined,
        appWallet,
        userWallet,
        username,
        firstName,
        lastName: lastName || undefined,
        // role/color are guaranteed set by the required-checks above.
        role: role!,
        city,
        country: region,
        favoriteFruit,
        preferredColor: color!,
      })
      // Convex is reactive — the /perfil getProfile query updates on its own.
      router.replace('/perfil')
    } catch {
      setFormError(t('errors.generic'))
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
            required
          />
        </div>
      </div>

      {/* Role — pick a track (Creativo / Negocio / Tecnología). */}
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
          {t('fields.role')}
          <span className="ml-1 text-magenta">*</span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLE_CATEGORIES.map((r) => {
            const active = role === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(active ? undefined : r)}
                aria-pressed={active}
                className={`flex h-[39px] cursor-pointer items-center gap-2 border-[1.5px] bg-card px-3 font-mono text-xs uppercase tracking-[0.08em] text-ink transition-colors ${
                  active ? 'border-magenta' : 'border-frame hover:border-magenta/60'
                }`}
              >
                <RoleIcon role={r} />
                {t(`roles.${r}`)}
              </button>
            )
          })}
        </div>
        <FieldError errors={fieldErrors.role} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          name="city"
          label={t('fields.city')}
          placeholder={t('fields.cityPlaceholder')}
          defaultValue={initial?.city ?? ''}
          errors={fieldErrors.city}
          required
        />
        <Field
          name="region"
          label={t('fields.region')}
          placeholder={t('fields.regionPlaceholder')}
          defaultValue={initial?.region ?? ''}
          errors={fieldErrors.region}
          required
        />
      </div>

      <Field
        name="favoriteFruit"
        label={t('fields.favoriteFruit')}
        placeholder={t('fields.favoriteFruitPlaceholder')}
        defaultValue={initial?.favoriteFruit ?? ''}
        errors={fieldErrors.favoriteFruit}
        required
      />

      {/* Preferred color — four canon-palette swatches. */}
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-2">
          {t('fields.preferredColor')}
          <span className="ml-1 text-magenta">*</span>
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
                className={`flex h-[39px] cursor-pointer items-center gap-2 border-[1.5px] bg-card pl-1.5 pr-3.5 font-mono text-xs uppercase tracking-[0.08em] text-ink transition-colors ${
                  selected ? 'border-magenta' : 'border-frame hover:border-magenta/60'
                }`}
              >
                <span
                  className="inline-block h-6 w-6 border border-frame/30"
                  style={{ backgroundColor: COLOR_VAR[c] }}
                  aria-hidden="true"
                />
                {t(`fields.colors.${c}`)}
              </button>
            )
          })}
        </div>
        <FieldError errors={fieldErrors.preferredColor} />
      </fieldset>

      {/* Form action → bottom-right (GUI/dialog convention, see DESIGN.md). */}
      <div className="flex justify-end">
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
