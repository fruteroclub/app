import { setRequestLocale } from 'next-intl/server'

import { Glyph, GlyphDefs, GLYPH_NAMES } from '@/components/Glyph'
import { ModeToggle } from '@/components/ModeToggle'
import { Avatar, Badge, Button, Card, ProgressBar } from '@/components/ui'

/**
 * Design-system demo route (T2 verify surface).
 *
 * Renders every UI primitive so the system can be eyeballed and QA'd against
 * DESIGN.md + the preview HTMLs. The whole page is statically rendered. It lives
 * in its own (design) route group (disjoint from the marketing + app groups) and
 * carries a LOCAL mode toggle so both registers — paper (default/public) and
 * arcade-dark (authed (app) surfaces) — can be inspected side by side.
 *
 * Public marketing pages remain paper-only; this demo is the one place the two
 * registers are shown together.
 */
export const dynamic = 'force-static'

const SCOPE = 'design-arcade-scope'

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="mx-auto max-w-[var(--wrap)] px-7 py-14">
      <GlyphDefs />

      <header className="mb-10 flex items-end justify-between border-b border-line pb-5">
        <div>
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-magenta">
            <Glyph
              name="target"
              size={13}
              className="mr-2 inline-block align-middle"
            />
            Sistema de diseño
          </p>
          <h1 className="font-display text-5xl font-extrabold tracking-[-0.03em]">
            Primitives
          </h1>
        </div>
      </header>

      {/* ---- Buttons (paper) ---- */}
      <Section index="01" title="Buttons" tag="HOVER LIFTS · PRESS DOWN">
        <div className="flex flex-wrap items-center gap-3.5">
          <Button>
            <Glyph name="bolt" size={13} /> Empieza a construir
          </Button>
          <Button variant="ghost">Explora el directorio →</Button>
          <Button variant="outline" size="sm">
            MODO
          </Button>
          <Button size="lg">
            <Glyph name="bolt" size={14} /> Crea tu perfil
          </Button>
          <Button disabled>Deshabilitado</Button>
          {/* asChild → renders an <a> with button styling (landing CTA pattern) */}
          <Button asChild variant="ghost">
            <a href="#">Como enlace</a>
          </Button>
        </div>
      </Section>

      {/* ---- Badges ---- */}
      <Section index="02" title="Badges" tag="LEVEL · TIER · ACCENT">
        <div className="flex flex-wrap items-center gap-3.5">
          <Badge variant="solid">NIVEL 07</Badge>
          <Badge variant="tier">Nivel 05+</Badge>
          <Badge variant="accent" tone="magenta">
            01 Shipped
          </Badge>
          <Badge variant="accent" tone="green">
            02 Events
          </Badge>
          <Badge variant="accent" tone="orange">
            03 Mentorship
          </Badge>
        </div>
      </Section>

      {/* ---- ProgressBar ---- */}
      <Section index="03" title="ProgressBar" tag="CLAMPED 0–100">
        <div className="grid max-w-md gap-4">
          <Labeled label="56% → magenta">
            <ProgressBar value={56} label="Reputación a nivel 08" />
          </Labeled>
          <Labeled label="45% → green">
            <ProgressBar value={45} fill="var(--green)" />
          </Labeled>
          <Labeled label="-20 clamps → 0%">
            <ProgressBar value={-20} />
          </Labeled>
          <Labeled label="180 clamps → 100%">
            <ProgressBar value={180} fill="var(--orange)" />
          </Labeled>
        </div>
      </Section>

      {/* ---- Cards + Avatars ---- */}
      <Section index="04" title="Cards · Avatars" tag="HAIR · HARD · LIFT">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card variant="hair" accent="magenta" className="p-5">
            <div className="font-mono text-xs tracking-[0.12em] text-muted-2">
              01 — SHIPPED
            </div>
            <div className="my-2 font-mono text-5xl font-bold text-magenta">
              24
            </div>
            <div className="text-sm font-semibold">Proyectos enviados</div>
          </Card>

          <Card variant="lift" className="cursor-pointer p-5">
            <div className="mb-4 flex items-center gap-3">
              <Avatar tone="green" size={46} alt="Builder placeholder" />
              <div>
                <div className="font-display text-lg font-bold tracking-[-0.01em]">
                  Mariana Ríos
                </div>
                <div className="text-xs text-muted">Smart Contracts</div>
              </div>
            </div>
            <div className="font-mono text-xs text-muted-2">
              hover para levantar ↗
            </div>
          </Card>

          <Card variant="hard" className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="font-display text-2xl font-bold tracking-[-0.01em]">
                Demo Slots
              </h3>
              <Badge variant="tier">Nivel 05+</Badge>
            </div>
            <p className="text-sm text-muted">
              Presenta tu proyecto ante la comunidad. 6–8 lugares por edición.
            </p>
          </Card>
        </div>
      </Section>

      {/* ---- Glyphs ---- */}
      <Section index="05" title="Glyphs" tag="RETRO-FUTURIST SVG">
        <div className="flex flex-wrap gap-6">
          {GLYPH_NAMES.map((name) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <Glyph
                name={name}
                size={24}
                title={name}
                style={{ color: 'var(--magenta)' }}
              />
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-2">
                {name}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- Arcade register (authed (app) surfaces) ---- */}
      <Section index="06" title="Arcade register" tag="(APP) DOPAMINE">
        <div
          id={SCOPE}
          data-mode="paper"
          className="border-2 border-black bg-paper p-7 shadow-hard"
        >
          <div className="mb-5 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-2">
              paper ↔ arcade
            </span>
            <ModeToggle scopeId={SCOPE} />
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            <Badge variant="solid">NIVEL 08</Badge>
            <Button size="sm">
              <Glyph name="bolt" size={12} /> Sube de nivel
            </Button>
            <div className="min-w-[200px] flex-1">
              <ProgressBar value={72} />
            </div>
          </div>
        </div>
      </Section>
    </main>
  )
}

function Section({
  index,
  title,
  tag,
  children,
}: {
  index: string
  title: string
  tag: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-line py-10">
      <div className="mb-7 flex items-center gap-3">
        <span className="font-mono text-xs tracking-[0.14em] text-muted-2">
          {index}
        </span>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">
          {title}
        </h2>
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-xs tracking-[0.1em] text-muted-2">
          {tag}
        </span>
      </div>
      {children}
    </section>
  )
}

function Labeled({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-xs uppercase tracking-[0.08em] text-muted-2">
        {label}
      </div>
      {children}
    </div>
  )
}
