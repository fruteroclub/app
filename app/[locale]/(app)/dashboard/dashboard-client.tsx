'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLocale, useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import type { PerfilData } from '../perfil/perfil-form'
import type { Locale } from '@/i18n/routing'

/**
 * The /dashboard surface — the member's "first board", styled like the public
 * Opportunity Marketplace ("Lo que puedes desbloquear"): the welcome BOUNTIES
 * (testimony · a GitHub project · a personal site) are a GRID of marketplace
 * cards, each with a Reputación currency chip + a done/pending status. Clicking a
 * card opens a modal (a bottom-sheet on mobile) to fulfill it.
 *
 * Bounties are stored ON the profile (testimony + links). /api/profile is a FULL
 * upsert, so saving one bounty re-POSTs the whole identity unchanged + the edited
 * field — completing a bounty never disturbs the rest of the profile.
 *
 *   not ready              → loading
 *   ready, !authenticated  → login CTA (the layout guard also redirects)
 *   authenticated, no row  → redirect to /perfil (create identity first)
 *   authenticated, has row → the bounties board
 */
type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; profile: PerfilData }
  | { kind: 'error'; message: string }

/** The three welcome bounties (stored as testimony / links.github / links.website). */
type BountyId = 'testimony' | 'github' | 'website'
const BOUNTY_IDS: readonly BountyId[] = ['testimony', 'github', 'website']

function bountyValue(profile: PerfilData, id: BountyId): string {
  if (id === 'testimony') return profile.testimony ?? ''
  return profile.links?.[id] ?? ''
}

export default function DashboardClient() {
  const t = useTranslations('dashboard')
  const tp = useTranslations('perfil.create')
  const locale = useLocale() as Locale
  const router = useRouter()
  const { ready, authenticated, login, getAccessToken } = usePrivy()

  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [active, setActive] = useState<BountyId | null>(null)

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      token = null
    }
    if (!token) {
      setState({ kind: 'error', message: t('errors.session') })
      return
    }
    try {
      const { profile } = await apiFetch<{ profile: PerfilData }>('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setState({ kind: 'ready', profile })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        router.replace('/perfil')
      } else if (error instanceof ApiError && error.status === 401) {
        setState({ kind: 'error', message: t('errors.session') })
      } else {
        setState({ kind: 'error', message: t('errors.load') })
      }
    }
  }, [getAccessToken, router, t])

  useEffect(() => {
    if (ready && authenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load()
    }
  }, [ready, authenticated, load])

  // FULL upsert: resend the whole identity unchanged + the one edited bounty
  // field, so saving a bounty never nulls another profile field (no PATCH route).
  async function saveBounty(id: BountyId, value: string): Promise<void> {
    if (state.kind !== 'ready') return
    const profile = state.profile
    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      token = null
    }
    if (!token) throw new Error(t('errors.session'))

    const links: Record<string, string> = { ...(profile.links ?? {}) }
    let testimony = profile.testimony ?? undefined
    if (id === 'testimony') {
      testimony = value || undefined
    } else if (value) {
      links[id] = value
    } else {
      delete links[id]
    }

    const { profile: updated } = await apiFetch<{ profile: PerfilData }>(
      '/api/profile',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          handle: profile.handle,
          displayName: profile.displayName,
          firstName: profile.firstName ?? undefined,
          lastName: profile.lastName ?? undefined,
          role: profile.role ?? undefined,
          location: profile.location ?? undefined,
          city: profile.city ?? undefined,
          region: profile.region ?? undefined,
          favoriteFruit: profile.favoriteFruit ?? undefined,
          preferredColor: profile.preferredColor ?? undefined,
          testimony,
          bio: profile.bio ?? undefined,
          links,
          locale,
        }),
      },
    )
    setState({ kind: 'ready', profile: updated })
  }

  if (!ready || (authenticated && state.kind === 'loading')) {
    return (
      <p role="status" aria-live="polite" className="font-mono text-xs text-muted-2">
        {t('loading')}
      </p>
    )
  }

  if (!authenticated) {
    return (
      <section className="mx-auto grid max-w-md justify-items-center gap-5 py-12 text-center md:py-20">
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-ink">
          {t('title')}
        </h1>
        <p className="max-w-[34ch] font-serif text-lg leading-[1.45] text-ink">{t('lead')}</p>
        <div className="mt-2">
          <Button onClick={() => login()}>
            <Glyph name="bolt" size={14} />
            {tp('loginCta')}
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
          className="border-2 border-black bg-card px-4 py-3 font-mono text-xs"
          style={{ color: 'var(--red)' }}
        >
          {state.message}
        </p>
        <div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <Glyph name="target" size={12} /> {t('retry')}
          </Button>
        </div>
      </section>
    )
  }

  if (state.kind !== 'ready') return null
  const profile = state.profile
  const doneCount = BOUNTY_IDS.filter((id) => bountyValue(profile, id)).length

  return (
    <>
      <section className="grid gap-8">
        <header className="grid gap-3">
          <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.025em] text-ink md:text-5xl">
            {t('title')}
          </h1>
          <p className="max-w-[52ch] font-serif text-lg leading-[1.45] text-muted">
            {t('lead')}
          </p>
        </header>

        {/* Category bar — the marketplace legend vibe (all bounties pay Reputación). */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 border-y-2 border-ink py-3">
          <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-magenta">
            <span className="inline-block h-2.5 w-2.5 bg-magenta" aria-hidden="true" />
            {t('reputation')}
          </span>
          <span className="ml-auto font-mono text-xs uppercase tracking-[0.12em] text-muted-2">
            {t('count', { done: doneCount, total: BOUNTY_IDS.length })}
          </span>
        </div>

        {/* Bounty board — the same card grid as the Opportunity Marketplace. */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BOUNTY_IDS.map((id) => {
            const done = Boolean(bountyValue(profile, id))
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className="group flex h-full cursor-pointer flex-col border-[3px] border-frame bg-surface p-6 text-left transition-colors hover:border-magenta"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-magenta">
                    <span className="inline-block h-2 w-2 bg-magenta" aria-hidden="true" />
                    {t('reputation')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] ${
                      done ? 'text-green' : 'text-muted-2'
                    }`}
                  >
                    {done ? <Glyph name="target" size={11} /> : null}
                    {done ? t('completed') : t('pending')}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-xl font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
                  {tp(`bounties.${id}.title`)}
                </h3>
                <p className="mt-2 flex-1 font-sans text-base leading-[1.5] text-muted">
                  {tp(`bounties.${id}.desc`)}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
                  <span className="font-mono text-xs font-bold text-magenta">
                    {tp('bounties.reward')}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.1em] text-magenta group-hover:underline">
                    {done ? t('edit') : t('complete')} →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {active ? (
        <BountyModal
          id={active}
          initialValue={bountyValue(profile, active)}
          onClose={() => setActive(null)}
          onSave={saveBounty}
        />
      ) : null}
    </>
  )
}

/**
 * The fulfill-a-bounty modal — a centered dialog on desktop, a bottom-sheet on
 * mobile. Holds the single field for the active bounty; on save it calls the
 * board's full-upsert and closes. Escape / overlay click / ✕ all dismiss.
 */
function BountyModal({
  id,
  initialValue,
  onClose,
  onSave,
}: {
  id: BountyId
  initialValue: string
  onClose: () => void
  onSave: (id: BountyId, value: string) => Promise<void>
}) {
  const t = useTranslations('dashboard')
  const tp = useTranslations('perfil.create')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const value = ((form.get('value') as string | null) ?? '').trim()
    try {
      await onSave(id, value)
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message || t('errors.save')
          : err instanceof Error
            ? err.message
            : t('errors.save'),
      )
      setSaving(false)
    }
  }

  const inputClass =
    'border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tp(`bounties.${id}.title`)}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg border-[3px] border-frame bg-card p-6 md:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-magenta">
              {t('reputation')} · {tp('bounties.reward')}
            </span>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.01em] text-ink">
              {tp(`bounties.${id}.title`)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancel')}
            className="cursor-pointer font-mono text-lg leading-none text-muted-2 transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 font-sans text-sm text-muted">{tp(`bounties.${id}.desc`)}</p>

        <form onSubmit={submit} noValidate className="mt-5 grid gap-4">
          {id === 'testimony' ? (
            <textarea
              name="value"
              rows={4}
              maxLength={280}
              defaultValue={initialValue}
              placeholder={tp('bounties.testimony.placeholder')}
              autoFocus
              className={inputClass}
            />
          ) : (
            <input
              name="value"
              type="text"
              defaultValue={initialValue}
              placeholder={tp(`bounties.${id}.placeholder`)}
              autoComplete="off"
              autoFocus
              className={inputClass}
            />
          )}

          {error ? (
            <p role="alert" className="font-mono text-xs" style={{ color: 'var(--red)' }}>
              {error}
            </p>
          ) : null}

          {/* Action → bottom-right (GUI/dialog convention, DESIGN.md). */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              <Glyph name="bolt" size={14} />
              {saving ? t('saving') : t('saveBounty')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
