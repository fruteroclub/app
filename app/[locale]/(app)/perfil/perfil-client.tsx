'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
    // The login gateway as the arcade cabinet's "insert coin / new player" screen:
    // a heavy framed magazine character page (marquee bezel + dark screen). Two
    // columns inside the screen — the pitch + login CTA, the Stage-1 steps card.
    return (
      <PerfilFrame mode={t('create.mode')} edition={t('create.edition')}>
        <div className="grid items-start gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
          <div className="grid gap-6">
            <GatewayHeader />
            <div>
              <Button onDark onClick={() => login()}>
                <Glyph name="bolt" size={14} />
                {t('create.loginCta')}
              </Button>
            </div>
          </div>
          <StepsCard />
        </div>
      </PerfilFrame>
    )
  }

  if (state.kind === 'create') {
    return (
      <PerfilFrame mode={t('create.modeCreate')} edition={t('create.edition')}>
        <div className="grid gap-8">
          <GatewayHeader />
          <PerfilForm mode="create" />
        </div>
      </PerfilFrame>
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
 * The signup eyebrow + title + lead, shared by the login gateway and the create
 * form. Eyebrow follows the marketing pattern (mono magenta + glyph + a trailing
 * hairline rule, as on /enterprise) so the surfaces stay consistent — one eyebrow,
 * used deliberately.
 */
function GatewayHeader() {
  const t = useTranslations('perfil.create')
  return (
    <header className="grid gap-4">
      <p className="flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
        <Glyph name="target" size={13} />
        {t('kicker')}
        <span className="h-px max-w-[120px] flex-1 bg-muted/50" />
      </p>
      <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.025em] text-white md:text-5xl">
        {t('title')}
      </h1>
      <p className="max-w-[48ch] font-serif text-lg leading-[1.45] text-muted">
        {t('lead')}
      </p>
    </header>
  )
}

/**
 * The Stage-1 checklist card shown beside the login CTA — what you'll do to
 * become a Community Member. A panel inside the cabinet screen (border-muted on
 * the dark frame), previewing the onboarding so the login reads as a character
 * sheet, not an empty void.
 */
function StepsCard() {
  const t = useTranslations('perfil.create')
  const items = t.raw('steps.items') as string[]
  return (
    <aside className="border-2 border-muted bg-black/30 p-6">
      <p className="mb-5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <Glyph name="grid" size={12} />
        {t('steps.title')}
      </p>
      <ol className="grid gap-3.5">
        {items.map((label, i) => (
          <li key={i} className="flex items-baseline gap-3 border-t border-muted/60 pt-3.5 first:border-t-0 first:pt-0">
            <span className="font-mono text-xs font-bold text-magenta">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-sm leading-snug text-ink">{label}</span>
          </li>
        ))}
      </ol>
    </aside>
  )
}

/**
 * PerfilFrame — the heavy arcade-cabinet frame around the perfil surface, the
 * twin of the Leaderboard cabinet: a `border-muted` frame + a black-bezel MARQUEE
 * (mode ▶ · PERFIL title plate · edition) + the dark `bg-frame` screen. Makes
 * /perfil read as a videogame-magazine character page. Lives on the (app) arcade
 * surface, so the inverted token contract applies (text-ink/white = light).
 */
function PerfilFrame({
  mode,
  edition,
  children,
}: {
  mode: string
  edition: string
  children: ReactNode
}) {
  const t = useTranslations('perfil.create')
  return (
    <div className="border-2 border-muted">
      {/* MARQUEE — the cabinet title plate on a black bezel. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-muted bg-black px-4 py-4 md:py-5">
        <span className="flex min-w-0 items-center gap-1.5 justify-self-start font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">
          <span
            aria-hidden
            className="shrink-0 text-magenta motion-safe:[animation:attract-blink_1.2s_steps(1,end)_infinite]"
          >
            ▶
          </span>
          <span className="truncate">{mode}</span>
        </span>
        <span className="justify-self-center font-mono text-2xl font-bold leading-none tracking-[-0.02em] text-white md:text-4xl">
          {t('plate')}
          <span className="text-magenta">.</span>
        </span>
        <span className="hidden justify-self-end truncate text-right font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted sm:block">
          {edition}
        </span>
      </div>
      {/* SCREEN — the dark cabinet interior where the character page renders. */}
      <div className="bg-frame p-6 md:p-10">{children}</div>
    </div>
  )
}
