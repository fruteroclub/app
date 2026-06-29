'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useMutation, useQuery } from 'convex/react'
import { useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { api } from '@/convex/_generated/api'
import { toMember, type MemberProfile } from '@/lib/member'

/**
 * The /dashboard surface — the member's "first board", styled like the public
 * Opportunity Marketplace ("Lo que puedes desbloquear"): the welcome BOUNTIES
 * (testimony · a GitHub project · a personal site) are a GRID of marketplace
 * cards, each with a Reputación currency chip + a done/pending status. Clicking a
 * card opens a modal (a bottom-sheet on mobile) to fulfill it.
 *
 * Bounties live on the profile (testimony + github/website URLs); each is saved
 * with the `saveBounty` Convex mutation, which patches just that one field. The
 * reactive `getProfile` query updates the board itself after a save.
 *
 *   not ready              → loading
 *   ready, !authenticated  → login CTA (the layout guard also redirects)
 *   authenticated, no row  → redirect to /perfil (create identity first)
 *   authenticated, has row → the bounties board
 */

/** The three welcome bounties — the `field` arg the saveBounty mutation expects. */
type BountyId = 'testimony' | 'github' | 'website'
const BOUNTY_IDS: readonly BountyId[] = ['testimony', 'github', 'website']

function bountyValue(profile: MemberProfile, id: BountyId): string {
  if (id === 'testimony') return profile.testimony ?? ''
  return profile.links[id] ?? ''
}

export default function DashboardClient() {
  const t = useTranslations('dashboard')
  const tp = useTranslations('perfil.create')
  const router = useRouter()
  const { ready, authenticated, login, user } = usePrivy()
  const data = useQuery(
    api.clubApp.getProfile,
    user?.id ? { privyDid: user.id } : 'skip',
  )
  const saveBountyMutation = useMutation(api.clubApp.saveBounty)

  const [active, setActive] = useState<BountyId | null>(null)

  const member = toMember(data ?? null)
  const loading =
    !ready || (authenticated && Boolean(user?.id) && data === undefined)

  // Authed with a resolved-but-empty profile → identity comes first.
  useEffect(() => {
    if (!loading && authenticated && !member) router.replace('/perfil')
  }, [loading, authenticated, member, router])

  /** Patch a single bounty field; the reactive query refreshes the board. */
  async function saveBounty(id: BountyId, value: string): Promise<void> {
    if (!user?.id) throw new Error(t('errors.session'))
    await saveBountyMutation({ privyDid: user.id, field: id, value })
  }

  if (loading) {
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

  // No profile yet → the effect above redirects to /perfil; render nothing.
  if (!member) return null
  const profile = member
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
          <Link
            href="/pulpa"
            className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-magenta hover:underline"
          >
            {t('whatIsPulpa')} →
          </Link>
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
      setError(err instanceof Error ? err.message : t('errors.save'))
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
        className="w-full max-w-lg border-[3px] border-frame bg-surface p-6 md:p-7"
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
