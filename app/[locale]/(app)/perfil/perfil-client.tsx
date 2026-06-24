'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import PerfilForm, { type PerfilData } from './perfil-form'
import PerfilView from './perfil-view'

/**
 * Data-load state for an AUTHENTICATED caller. The unauthenticated "signin"
 * surface is derived from Privy's `ready`/`authenticated` during render (not
 * stored), so the effect never calls setState synchronously.
 */
type LoadState =
  | { kind: 'loading' }
  | { kind: 'create' } // authed, no profile yet → show create form
  | { kind: 'view'; profile: PerfilData } // authed, profile exists
  | { kind: 'error'; message: string }

/**
 * The /perfil destination — it is BOTH the signup entry and the profile view
 * (per plan SIGNUP: "Crea tu perfil" → Privy login → create → view).
 *
 *   not ready              → loading
 *   ready, !authenticated  → login CTA (opens the Privy modal)
 *   authenticated, no row  → create form
 *   authenticated, has row → the perfil view
 *
 * No silent failure: a failed load shows an explicit error with a retry, never
 * a blank screen. The (app) layout guard ALSO redirects unauthed users here, so
 * this component is the single source of the "create your perfil" surface.
 */
export default function PerfilClient() {
  const t = useTranslations('perfil')
  const { ready, authenticated, login, getAccessToken } = usePrivy()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  const loadProfile = useCallback(async () => {
    setState({ kind: 'loading' })
    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      token = null
    }
    if (!token) {
      // No token despite being authenticated → surface a re-auth error rather
      // than a blank screen; the layout guard will also redirect.
      setState({ kind: 'error', message: t('create.errors.session') })
      return
    }
    try {
      const { profile } = await apiFetch<{ profile: PerfilData }>(
        '/api/profile',
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setState({ kind: 'view', profile })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setState({ kind: 'create' })
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
    // Effect-driven data fetch (React docs' "fetching data" pattern): once Privy
    // is ready AND authenticated, load the perfil. `loadProfile` only ever calls
    // setState in async continuations after the fetch resolves — the lint rule
    // flags any setState reachable from an effect, but this is the sanctioned
    // data-fetch case, so it is scoped-disabled here.
    if (ready && authenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadProfile()
    }
  }, [ready, authenticated, loadProfile])

  // Derived: not ready yet → loading; ready but unauthenticated → signin CTA.
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

  if (!authenticated) {
    // The login: a clean, centered editorial card on warm paper — a professional
    // exterior that reads as a Login page first. The CTA opens the Privy modal.
    return (
      <section className="mx-auto grid max-w-md justify-items-center gap-5 py-12 text-center md:py-20">
        <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
          <Glyph name="target" size={13} />
          {t('create.kicker')}
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-ink">
          {t('create.title')}
        </h1>
        <p className="max-w-[34ch] font-serif text-lg leading-[1.45] text-muted">
          {t('create.lead')}
        </p>
        <div className="mt-2">
          <Button onClick={() => login()}>
            <Glyph name="bolt" size={14} />
            {t('create.loginCta')}
          </Button>
        </div>
      </section>
    )
  }

  if (state.kind === 'create') {
    return (
      <section className="grid gap-8">
        <CreateHeader />
        <PerfilForm mode="create" />
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
          <Button variant="outline" size="sm" onClick={() => void loadProfile()}>
            <Glyph name="target" size={12} /> Reintentar
          </Button>
        </div>
      </section>
    )
  }

  if (state.kind === 'view') {
    return <PerfilView profile={state.profile} />
  }

  // `loading` already handled above for the authed path; this is a safe fallback.
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

/**
 * The create-form header — the editorial eyebrow + title + lead above the form
 * (left-aligned, warm paper). Eyebrow follows the marketing pattern (mono magenta
 * + glyph + a trailing hairline rule, as on /enterprise).
 */
function CreateHeader() {
  const t = useTranslations('perfil.create')
  return (
    <header className="grid gap-4">
      <p className="flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
        <Glyph name="target" size={13} />
        {t('kicker')}
        <span className="h-px max-w-[120px] flex-1 bg-line" />
      </p>
      <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.025em] text-ink md:text-5xl">
        {t('title')}
      </h1>
      <p className="max-w-[48ch] font-serif text-lg leading-[1.45] text-muted">
        {t('lead')}
      </p>
    </header>
  )
}
