'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import { API_ERROR_CODES } from '@/lib/api/response'
import { HONEYPOT_FIELD } from '@/lib/validators/contact'
import type { Locale } from '@/i18n/routing'

type FieldErrors = Record<string, string[] | undefined>

/**
 * ContactForm — the single lead-capture island on /enterprise (T6).
 *
 * The ONLY interactive island on the otherwise-static marketing surface (plan:
 * "ContactForm the only island"). PAPER-ONLY — no MODO toggle here (D-mode).
 *
 * POSTs to /api/contact and branches on the route's status codes:
 *   200/201 → success state (form replaced by a thank-you)
 *   400     → inline field errors (zod.flatten().fieldErrors)
 *   429     → rate-limited banner
 *   502     → DB-down banner WITH the fallback email address (no stranded user)
 *   other   → a single user-visible error banner (no silent failure)
 *
 * Spam defense is the HONEYPOT (`company_website`): a visually hidden, non-tab-
 * focusable field real users never fill. The server pretends success if it's set.
 */
export function ContactForm({
  source = 'enterprise',
}: {
  source?: 'enterprise' | 'landing'
}) {
  const t = useTranslations('enterprise.contact')
  const locale = useLocale() as Locale

  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return // double-submit guard (button is also disabled)
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    const form = new FormData(event.currentTarget)
    const payload = {
      name: ((form.get('name') as string | null) ?? '').trim(),
      email: ((form.get('email') as string | null) ?? '').trim(),
      org: ((form.get('org') as string | null) ?? '').trim(),
      message: ((form.get('message') as string | null) ?? '').trim(),
      // Honeypot — sent as-is. Real users leave it empty.
      [HONEYPOT_FIELD]: (form.get(HONEYPOT_FIELD) as string | null) ?? '',
      source,
      locale,
    }

    try {
      await apiFetch<{ received: boolean }>('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSucceeded(true)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === API_ERROR_CODES.VALIDATION_ERROR) {
          const details = error.details as
            | { fieldErrors?: FieldErrors }
            | undefined
          setFieldErrors(details?.fieldErrors ?? {})
          setFormError(t('errors.validation'))
        } else if (error.code === API_ERROR_CODES.RATE_LIMITED) {
          setFormError(t('errors.rateLimited'))
        } else if (error.status === 502) {
          // DB down — the message carries the fallback email from the server.
          setFormError(error.message || t('errors.generic'))
        } else {
          setFormError(error.message || t('errors.generic'))
        }
      } else {
        setFormError(t('errors.generic'))
      }
      setSubmitting(false)
    }
  }

  if (succeeded) {
    return (
      <div
        role="status"
        className="border-2 border-black bg-card p-6"
      >
        <div className="mb-2 flex items-center gap-2 font-display text-xl font-semibold">
          <Glyph name="star" size={18} style={{ color: 'var(--green)' }} />
          {t('success.title')}
        </div>
        <p className="font-sans text-sm text-muted">{t('success.body')}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid max-w-2xl gap-6"
      aria-describedby={formError ? 'contact-form-error' : undefined}
    >
      {formError ? (
        <p
          id="contact-form-error"
          role="alert"
          className="border-2 border-black bg-card px-4 py-3 font-mono text-xs"
          style={{ color: 'var(--red)' }}
        >
          {formError}
        </p>
      ) : null}

      <Field
        name="name"
        label={t('fields.name')}
        defaultValue=""
        errors={fieldErrors.name}
        required
        autoComplete="name"
      />
      <Field
        name="email"
        type="email"
        label={t('fields.email')}
        defaultValue=""
        errors={fieldErrors.email}
        required
        autoComplete="email"
      />
      <Field
        name="org"
        label={t('fields.org')}
        placeholder={t('fields.orgPlaceholder')}
        defaultValue=""
        errors={fieldErrors.org}
        autoComplete="organization"
      />

      <div className="grid gap-1.5">
        <label
          htmlFor="message"
          className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2"
        >
          {t('fields.message')}
          <span className="ml-1 text-magenta">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={2000}
          required
          placeholder={t('fields.messagePlaceholder')}
          aria-invalid={
            fieldErrors.message && fieldErrors.message.length > 0
              ? true
              : undefined
          }
          className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta aria-[invalid=true]:border-red"
        />
        <FieldError errors={fieldErrors.message} />
      </div>

      {/* Honeypot — visually hidden, off the tab order, ignored by real users.
          NOT display:none so naive bots that skip hidden inputs still fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Company website</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div>
        <Button type="submit" size="lg" disabled={submitting}>
          <Glyph name="bolt" size={14} />
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  hint,
  placeholder,
  defaultValue,
  errors,
  required,
  autoComplete,
}: {
  name: string
  label: string
  type?: string
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
        type={type}
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
    <span role="alert" className="font-mono text-xs" style={{ color: 'var(--red)' }}>
      {errors[0]}
    </span>
  )
}
