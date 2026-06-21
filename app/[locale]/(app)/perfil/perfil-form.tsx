'use client'

import { useState, type FormEvent } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLocale, useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import { API_ERROR_CODES } from '@/lib/api/response'
import type { Locale } from '@/i18n/routing'

/** The profile shape the server returns (subset of the DB row). */
export interface PerfilData {
  id: string
  handle: string
  displayName: string
  role: string | null
  location: string | null
  bio: string | null
  links: Record<string, string> | null
  locale: Locale
  createdAt: string
  updatedAt: string
}

type FieldErrors = Record<string, string[] | undefined>

/**
 * The create/edit form for a perfil. Shared by /perfil (create) and
 * /perfil/edit (edit). Gets a fresh Privy access token, POSTs to /api/profile
 * with a Bearer header, and branches on the route's status codes:
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return // double-submit guard (button is also disabled)
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    const form = new FormData(event.currentTarget)
    const links: Record<string, string> = {}
    for (const key of ['github', 'twitter', 'linkedin', 'website'] as const) {
      const v = (form.get(key) as string | null)?.trim()
      if (v) links[key] = v
    }
    const payload = {
      handle: ((form.get('handle') as string | null) ?? '').trim(),
      displayName: ((form.get('displayName') as string | null) ?? '').trim(),
      role: ((form.get('role') as string | null) ?? '').trim(),
      location: ((form.get('location') as string | null) ?? '').trim(),
      bio: ((form.get('bio') as string | null) ?? '').trim(),
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
    <form onSubmit={onSubmit} noValidate className="grid max-w-2xl gap-6">
      {formError ? (
        <p
          role="alert"
          className="border-2 border-black bg-card px-4 py-3 font-mono text-xs text-red shadow-hard-sm"
          style={{ color: 'var(--red)' }}
        >
          {formError}
        </p>
      ) : null}

      <Field
        name="handle"
        label={t('fields.handle')}
        hint={t('fields.handleHint')}
        defaultValue={initial?.handle}
        errors={fieldErrors.handle}
        required
        autoComplete="off"
      />
      <Field
        name="displayName"
        label={t('fields.displayName')}
        defaultValue={initial?.displayName}
        errors={fieldErrors.displayName}
        required
      />
      <Field
        name="role"
        label={t('fields.role')}
        placeholder={t('fields.rolePlaceholder')}
        defaultValue={initial?.role ?? ''}
        errors={fieldErrors.role}
      />
      <Field
        name="location"
        label={t('fields.location')}
        placeholder={t('fields.locationPlaceholder')}
        defaultValue={initial?.location ?? ''}
        errors={fieldErrors.location}
      />

      <div className="grid gap-1.5">
        <label
          htmlFor="bio"
          className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2"
        >
          {t('fields.bio')}
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={280}
          defaultValue={initial?.bio ?? ''}
          className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta"
        />
        <span className="font-mono text-xs text-muted-2">
          {t('fields.bioHint')}
        </span>
        <FieldError errors={fieldErrors.bio} />
      </div>

      <fieldset className="grid gap-4 border-t border-line pt-5">
        <Field
          name="github"
          label={t('fields.github')}
          defaultValue={initial?.links?.github ?? ''}
          autoComplete="off"
        />
        <Field
          name="twitter"
          label={t('fields.twitter')}
          defaultValue={initial?.links?.twitter ?? ''}
          autoComplete="off"
        />
        <Field
          name="linkedin"
          label={t('fields.linkedin')}
          defaultValue={initial?.links?.linkedin ?? ''}
          autoComplete="off"
        />
        <Field
          name="website"
          label={t('fields.website')}
          defaultValue={initial?.links?.website ?? ''}
          autoComplete="off"
        />
      </fieldset>

      <div>
        <Button type="submit" size="lg" disabled={submitting}>
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
