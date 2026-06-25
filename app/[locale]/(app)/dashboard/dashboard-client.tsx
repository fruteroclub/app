'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useLocale, useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import type { PerfilData } from '../perfil/perfil-form'
import type { Locale } from '@/i18n/routing'

/**
 * The /dashboard surface — the member's "first board". It hosts the welcome
 * BOUNTIES (testimony + a GitHub project + a personal site), which used to live
 * inside the /perfil create form. /perfil is the identity profile now; bounties
 * are a separate, ongoing activity here.
 *
 * Data flow: load the caller's profile (GET /api/profile). Bounties are stored
 * ON the profile (testimony + links), and /api/profile is a FULL upsert, so a
 * save re-POSTs the WHOLE identity unchanged plus the edited bounty fields — that
 * way completing a bounty never disturbs the rest of the profile.
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

export default function DashboardClient() {
  const t = useTranslations('dashboard')
  const tp = useTranslations('perfil.create')
  const locale = useLocale() as Locale
  const router = useRouter()
  const { ready, authenticated, login, getAccessToken } = usePrivy()

  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
        // No identity yet → you must create your perfil before the board.
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || state.kind !== 'ready') return
    const profile = state.profile
    setSaving(true)
    setSaved(false)
    setSaveError(null)

    const form = new FormData(event.currentTarget)
    const str = (k: string) => ((form.get(k) as string | null) ?? '').trim()
    const links: Record<string, string> = { ...(profile.links ?? {}) }
    for (const key of ['github', 'website'] as const) {
      const v = str(key)
      if (v) links[key] = v
      else delete links[key]
    }

    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      token = null
    }
    if (!token) {
      setSaveError(t('errors.session'))
      setSaving(false)
      return
    }

    // FULL upsert: resend the whole identity unchanged + the edited bounties, so
    // saving a bounty never nulls another profile field (the API has no PATCH).
    const payload = {
      handle: profile.handle,
      displayName: profile.displayName,
      role: profile.role ?? undefined,
      location: profile.location ?? undefined,
      city: profile.city ?? undefined,
      region: profile.region ?? undefined,
      favoriteFruit: profile.favoriteFruit ?? undefined,
      preferredColor: profile.preferredColor ?? undefined,
      testimony: str('testimony') || undefined,
      bio: profile.bio ?? undefined,
      links,
      locale,
    }

    try {
      const { profile: updated } = await apiFetch<{ profile: PerfilData }>('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      setState({ kind: 'ready', profile: updated })
      setSaved(true)
    } catch (error) {
      setSaveError(
        error instanceof ApiError ? error.message || t('errors.save') : t('errors.save'),
      )
    } finally {
      setSaving(false)
    }
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

  return (
    <section className="grid gap-8">
      <header className="grid gap-3">
        <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.025em] text-ink md:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-[52ch] font-serif text-lg leading-[1.45] text-muted">{t('lead')}</p>
      </header>

      <form onSubmit={onSubmit} noValidate className="grid max-w-2xl gap-5">
        {saveError ? (
          <p
            role="alert"
            className="border-2 border-black bg-card px-4 py-3 font-mono text-xs"
            style={{ color: 'var(--red)' }}
          >
            {saveError}
          </p>
        ) : null}

        <BountyCard
          title={tp('bounties.testimony.title')}
          desc={tp('bounties.testimony.desc')}
          reward={tp('bounties.reward')}
          optional={tp('bounties.optional')}
        >
          <textarea
            id="testimony"
            name="testimony"
            rows={3}
            maxLength={280}
            defaultValue={profile.testimony ?? ''}
            placeholder={tp('bounties.testimony.placeholder')}
            className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta"
          />
        </BountyCard>

        <BountyCard
          title={tp('bounties.github.title')}
          desc={tp('bounties.github.desc')}
          reward={tp('bounties.reward')}
          optional={tp('bounties.optional')}
        >
          <input
            id="github"
            name="github"
            type="text"
            aria-label={tp('fields.github')}
            defaultValue={profile.links?.github ?? ''}
            placeholder={tp('bounties.github.placeholder')}
            autoComplete="off"
            className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta"
          />
        </BountyCard>

        <BountyCard
          title={tp('bounties.website.title')}
          desc={tp('bounties.website.desc')}
          reward={tp('bounties.reward')}
          optional={tp('bounties.optional')}
        >
          <input
            id="website"
            name="website"
            type="text"
            aria-label={tp('fields.website')}
            defaultValue={profile.links?.website ?? ''}
            placeholder={tp('bounties.website.placeholder')}
            autoComplete="off"
            className="border-[1.5px] border-ink bg-card px-3 py-2 font-sans text-sm text-ink outline-none focus-visible:border-magenta"
          />
        </BountyCard>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            <Glyph name="bolt" size={14} />
            {saving ? t('saving') : t('save')}
          </Button>
          {saved ? (
            <span role="status" className="font-mono text-xs text-magenta">
              {t('saved')}
            </span>
          ) : null}
        </div>
      </form>
    </section>
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
    <article className="grid gap-3 border-[1.5px] border-line bg-surface/50 p-5">
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
