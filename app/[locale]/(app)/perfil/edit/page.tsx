import { setRequestLocale } from 'next-intl/server'

import { GlyphDefs } from '@/components/Glyph'
import EditClient from './edit-client'

/** /perfil/edit — authed edit form for the caller's existing perfil. */
export const dynamic = 'force-dynamic'

export default async function PerfilEditPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-7 py-14">
      <GlyphDefs />
      <EditClient />
    </main>
  )
}
