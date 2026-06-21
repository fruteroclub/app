import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

/**
 * Single-path Open Graph image (T7).
 *
 * ONE OG image for the whole site (plan T7: "single-path opengraph-image"). Next
 * picks this file up by convention; `lib/seo.buildMetadata` references it
 * implicitly via the file-based metadata, so every marketing route shares this
 * exact card. Rendered on the edge with the paper register of the design system
 * (warm cream, ink, magenta accent dot) — PAPER-ONLY, matching the public
 * surface. No external font fetch (keeps the edge render dependency-free and
 * failure-free); the visual identity is carried by color + the magenta period.
 */

export const runtime = 'edge'
export const alt = `${SITE_NAME} — Talent Accelerator`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Paper-register tokens (mirrors styles/globals.css :root).
const PAPER = '#f9f5ef'
const INK = '#11091e'
const MAGENTA = '#c4088f'
const MUTED = '#5b5170'
const LINE = '#dcd3c4'

export default function OpengraphImage() {
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
          // Top ink rule echoes the masthead's 5px ink border.
          borderTop: `16px solid ${INK}`,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: MAGENTA,
            fontFamily: 'monospace',
          }}
        >
          Talent Accelerator
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontSize: 116,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -3,
              color: INK,
            }}
          >
            Frutero&nbsp;Club
            <span style={{ color: MAGENTA }}>.</span>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 36,
              lineHeight: 1.3,
              color: MUTED,
              maxWidth: 880,
            }}
          >
            Construye. Demuestra tu trabajo con reputación verificable. Desbloquea
            oportunidades reales.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `2px solid ${LINE}`,
            paddingTop: 28,
            fontSize: 22,
            fontFamily: 'monospace',
            color: MUTED,
          }}
        >
          <span style={{ display: 'flex' }}>frutero.club</span>
          <span style={{ display: 'flex', color: INK, letterSpacing: 2 }}>
            COMUNIDAD DE BUILDERS · LATAM
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
