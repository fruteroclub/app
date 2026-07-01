'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from 'convex/react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui'
import { Glyph } from '@/components/Glyph'
import { Link } from '@/i18n/navigation'
import { api } from '@/convex/_generated/api'
import { toMember } from '@/lib/member'
import PerfilForm from '../perfil-form'

/**
 * /perfil/edit — reads the caller's perfil from the reactive Convex query
 * (`api.clubApp.getProfile` by Privy DID) and renders the form in edit mode. If
 * there is no profile yet, it points the user to /perfil (create).
 */
export default function EditClient() {
  const t = useTranslations('perfil')
  const locale = useLocale()
  const { ready, authenticated, user } = usePrivy()
  const data = useQuery(
    api.clubApp.getProfile,
    user?.id ? { privyDid: user.id } : 'skip',
  )

  if (!ready || (authenticated && Boolean(user?.id) && data === undefined)) {
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

  const member = toMember(data ?? null)

  if (!authenticated || !member) {
    return (
      <section className="grid max-w-xl gap-4">
        <p className="text-base text-muted">
          {!authenticated ? t('create.errors.session') : t('view.empty')}
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

  return (
    <section className="mx-auto grid w-full max-w-2xl gap-7">
      <header className="grid gap-3">
        <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.025em] text-ink md:text-5xl">
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
      <PerfilForm mode="edit" initial={member} />
    </section>
  )
}
