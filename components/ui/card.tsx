import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Card — the surface container family (DESIGN.md → Borders/Shadows, Components).
 *
 * hair:  default — 1px hairline border, no shadow. The everyday card.
 * hard:  hard 2px ink border + offset shadow (the high-score / unlock card —
 *        a signature element).
 * lift:  hairline at rest, hover-lifts with a hard offset shadow (directory
 *        builder card — the ONLY place hover-shadow appears).
 *
 * `accent` paints a 4px colored top bar (stat card / builder card / pillars
 * convention: 01 magenta, 02 green, 03 orange).
 */
const cardVariants = cva('relative bg-card', {
  variants: {
    variant: {
      hair: 'border border-line',
      hard: 'border-2 border-black',
      lift: 'border-[1.5px] border-ink transition-colors duration-100 hover:border-magenta',
    },
  },
  defaultVariants: {
    variant: 'hair',
  },
})

const ACCENT_COLOR: Record<NonNullable<CardProps['accent']>, string> = {
  magenta: 'var(--magenta)',
  green: 'var(--green)',
  orange: 'var(--orange)',
  muted: 'var(--muted-canonical)',
}

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants> & {
    /** 4px colored top-bar accent (per-dimension color convention). */
    accent?: 'magenta' | 'green' | 'orange' | 'muted'
  }

function Card({ className, variant, accent, children, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    >
      {accent ? (
        <span
          data-slot="card-accent"
          aria-hidden="true"
          className="absolute left-0 top-0 h-1 w-[50px]"
          style={{ background: ACCENT_COLOR[accent] }}
        />
      ) : null}
      {children}
    </div>
  )
}

export { Card, cardVariants }
