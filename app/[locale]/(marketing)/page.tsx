import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'

/**
 * SCAFFOLD shell (T1). T5 replaces this with the 8-section public landing
 * assembled from components/marketing/* + content/landing.ts + the `landing`
 * message namespace. Kept static and paper-only so the build gate passes.
 */
export const dynamic = 'force-static'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('common')

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '16px',
        padding: '70px 28px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--magenta)',
          fontWeight: 600,
        }}
      >
        {t('brand.tagline')}
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: '64px',
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          margin: 0,
        }}
      >
        {t('brand.name')}
      </h1>
      <p style={{ fontFamily: 'var(--sans)', color: 'var(--muted)' }}>
        Scaffold shell · landing built in T5.
      </p>
    </main>
  )
}
