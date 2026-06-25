import { setRequestLocale } from 'next-intl/server'

import { GlyphDefs } from '@/components/Glyph'
import DashboardClient from './dashboard-client'

/**
 * /dashboard — the member's home board (Stage-1 "first board"). It hosts the
 * welcome BOUNTIES (testimony, a GitHub project, a personal site); the /perfil
 * route is now the IDENTITY profile only. Authed (app) group → dynamic; the
 * layout supplies the Privy provider + auth guard.
 */
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-7 py-14">
      <GlyphDefs />
      <DashboardClient />
    </main>
  )
}
