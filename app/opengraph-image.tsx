import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

/**
 * Single-path Open Graph image (T7).
 *
 * ONE OG card for the whole site. Rendered with the PAPER register of the design
 * system (warm cream, ink, magenta accent) and the real brand fonts — Petrona
 * (eyebrow + copy), IBM Plex Mono (wordmark), Bitter (footer lockup) — loaded
 * from @fontsource as .woff (the only Satori-supported web format besides ttf/
 * otf; woff2 is NOT supported). Magenta is used as PUNCTUATION: every period is
 * the brand dot.
 *
 * Runtime is `nodejs` (not edge) so the fonts + logo are read from disk at BUILD
 * time and the card is statically generated — no runtime font fetch, no edge
 * failure modes, no network dependency.
 */

export const runtime = 'nodejs'
export const alt = `${SITE_NAME} — Aceleradora de Talento`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Paper-register tokens (mirrors styles/globals.css :root).
const PAPER = '#f9f5ef'
const INK = '#11091e'
const MAGENTA = '#c4088f'
const FRAME = '#110b1a'

const fontFile = (pkg: string, file: string) =>
  readFileSync(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file))

const logoDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public', 'logo.png'),
).toString('base64')}`

/** Magenta brand dot — inherits the surrounding font so the glyph matches. */
function Dot() {
  return <span style={{ color: MAGENTA }}>.</span>
}

/**
 * Body — the actions → reward statement. The three verbs in Bitter medium (only
 * the dots magenta), then the payoff "Oportunidades Reales." in Petrona, both
 * words capitalized, with the magenta brand dot.
 */
function BodyCopy() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}>
      <div
        style={{
          display: 'flex',
          columnGap: 18,
          fontFamily: 'Bitter',
          fontWeight: 500,
          fontSize: 46,
          color: INK,
        }}
      >
        <span style={{ display: 'flex' }}>
          Construye
          <Dot />
        </span>
        <span style={{ display: 'flex' }}>
          Demuestra
          <Dot />
        </span>
        <span style={{ display: 'flex' }}>
          Desbloquea
          <Dot />
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          marginTop: 14,
          fontFamily: 'Petrona',
          fontWeight: 600,
          fontSize: 46,
          color: INK,
        }}
      >
        Oportunidades Reales
        <Dot />
      </div>
    </div>
  )
}

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: PAPER,
          padding: '72px 80px',
          borderTop: `16px solid ${INK}`,
          fontFamily: 'Petrona',
        }}
      >
        {/* Eyebrow — Petrona, magenta */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Petrona',
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: 1,
            color: MAGENTA,
          }}
        >
          Aceleradora de Talento
        </div>

        {/* Wordmark + body */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Logo + "Frutero Club." — IBM Plex Mono, logo matches text height */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <img src={logoDataUri} width={104} height={104} alt="" />
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                fontFamily: 'IBM Plex Mono',
                fontWeight: 700,
                fontSize: 104,
                lineHeight: 1,
                letterSpacing: -3,
                color: INK,
              }}
            >
              Frutero&nbsp;Club
              <Dot />
            </div>
          </div>

          <BodyCopy />
        </div>

        {/* Footer lockup — Bitter. No divider; "Sube de nivel." reads as the
            CTA in a frame-colored border, bumped a size. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'Bitter',
            fontWeight: 600,
            color: INK,
          }}
        >
          <div style={{ display: 'flex', fontSize: 28 }}>
            frutero
            <Dot />
            club
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontSize: 34,
              border: `4px solid ${FRAME}`,
              padding: '12px 30px',
            }}
          >
            Sube de nivel
            <Dot />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Petrona', data: fontFile('petrona', 'petrona-latin-600-normal.woff'), weight: 600, style: 'normal' },
        { name: 'IBM Plex Mono', data: fontFile('ibm-plex-mono', 'ibm-plex-mono-latin-700-normal.woff'), weight: 700, style: 'normal' },
        { name: 'Bitter', data: fontFile('bitter', 'bitter-latin-500-normal.woff'), weight: 500, style: 'normal' },
        { name: 'Bitter', data: fontFile('bitter', 'bitter-latin-600-normal.woff'), weight: 600, style: 'normal' },
      ],
    },
  )
}
