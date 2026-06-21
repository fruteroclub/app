import { setRequestLocale } from 'next-intl/server'

import { GlyphDefs } from '@/components/Glyph'
import PerfilClient from './perfil-client'

/**
 * /perfil — THE signup destination (plan SIGNUP) and the perfil view.
 *
 * Authed (app) group → dynamic. The (app) layout supplies the Privy provider +
 * auth guard + arcade mode; this page renders the glyph sprite once, then the
 * client flow (login CTA → create form → perfil view), all keyed off the
 * Bearer-verified /api/profile endpoint.
 */
export const dynamic = 'force-dynamic'

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-7 py-14">
      <GlyphDefs />
      <PerfilClient />
    </main>
  )
}
