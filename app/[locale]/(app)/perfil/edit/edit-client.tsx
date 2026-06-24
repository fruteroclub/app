'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { Link } from '@/i18n/navigation'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import PerfilForm, { type PerfilData } from '../perfil-form'

/**
 * Data-load state for an AUTHENTICATED caller. The unauthenticated surface is
 * derived from Privy `ready`/`authenticated` during render so the effect never
 * calls setState synchronously.
 */
type LoadState =
  | { kind: 'loading' }
  | { kind: 'edit'; profile: PerfilData }
  | { kind: 'missing' } // authed but no profile yet → send to create
  | { kind: 'error'; message: string }

/**
 * /perfil/edit — loads the caller's existing perfil (Bearer-verified GET) and
 * renders the form in edit mode. If there is no profile yet, it points the user
 * to /perfil (create). No silent failure: load errors show an explicit message.
 */
export default function EditClient() {
  const t = useTranslations('perfil')
  const locale = useLocale()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      token = null
    }
    if (!token) {
      setState({ kind: 'error', message: t('create.errors.session') })
      return
    }
    try {
      const { profile } = await apiFetch<{ profile: PerfilData }>(
        '/api/profile',
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setState({ kind: 'edit', profile })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setState({ kind: 'missing' })
      } else if (error instanceof ApiError && error.status === 401) {
        setState({ kind: 'error', message: t('create.errors.session') })
      } else {
        setState({
          kind: 'error',
          message:
            error instanceof ApiError
              ? error.message
              : t('create.errors.generic'),
        })
      }
    }
  }, [getAccessToken, t])

  useEffect(() => {
    // Effect-driven data fetch (React docs' "fetching data" pattern); setState
    // only fires in async continuations. Sanctioned data-fetch → scoped disable.
    if (ready && authenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load()
    }
  }, [ready, authenticated, load])

  if (!ready || (ready && authenticated && state.kind === 'loading')) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="font-mono text-xs text-muted-2"
      >
        {t('view.loading')}
      </p>
    )
  }

  if (!authenticated || state.kind === 'missing') {
    return (
      <section className="grid max-w-xl gap-4">
        <p className="text-base text-muted">
          {!authenticated
            ? t('create.errors.session')
            : t('view.empty')}
        </p>
        <div>
          <Button asChild>
            <Link href="/perfil" locale={locale}>
              <Glyph name="bolt" size={14} /> {t('view.createCta')}
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  if (state.kind === 'error') {
    return (
      <section className="grid max-w-xl gap-4">
        <p
          role="alert"
          className="border-2 border-black bg-card px-4 py-3 font-mono text-xs shadow-hard-sm"
          style={{ color: 'var(--red)' }}
        >
          {state.message}
        </p>
        <div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <Glyph name="target" size={12} /> Reintentar
          </Button>
        </div>
      </section>
    )
  }

  if (state.kind === 'edit') {
    return (
      <section className="grid gap-7">
        <header className="grid gap-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
            <Glyph
              name="target"
              size={13}
              className="mr-2 inline-block align-middle"
            />
            {t('edit.kicker')}
          </p>
          <h1 className="font-display text-5xl font-bold tracking-[-0.025em]">
            {t('edit.title')}
          </h1>
          <Link
            href="/perfil"
            locale={locale}
            className="font-mono text-xs uppercase tracking-[0.08em] text-muted-2 no-underline hover:text-ink"
          >
            ← {t('edit.back')}
          </Link>
        </header>
        <PerfilForm mode="edit" initial={state.profile} />
      </section>
    )
  }

  // `loading` already handled above for the authed path; safe fallback.
  return (
    <p
      role="status"
      aria-live="polite"
      className="font-mono text-xs text-muted-2"
    >
      {t('view.loading')}
    </p>
  )
}
