import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Badge — the small mono-labeled chips from the previews (DESIGN.md → Components).
 *
 * tier:   purple block, 1.5px hard border, mono uppercase ("RARE", "CONTRIBUTOR")
 *         — the rarity / directory tier chip.
 * accent: a per-dimension colored chip (magenta / green / orange) used for
 *         eyebrows and status. Hairline, no shadow.
 * solid:  the signature block badge — purple block + hard border.
 *         In arcade mode the bg flips to magenta (see globals / DESIGN.md).
 *
 * Neobrutalist shadow lives only on `solid` (a signature element).
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-mono uppercase whitespace-nowrap leading-none',
  {
    variants: {
      variant: {
        tier: 'text-white bg-purple border-[1.5px] border-black text-xs tracking-[0.1em] px-[9px] py-1',
        accent:
          'border-[1.5px] text-xs tracking-[0.1em] px-[9px] py-1 bg-transparent',
        solid:
          'text-white bg-purple border-2 border-black text-xs tracking-[0.1em] px-[9px] py-1 [[data-mode=arcade]_&]:bg-magenta',
      },
      tone: {
        ink: 'text-ink border-line',
        magenta: 'text-magenta border-magenta',
        green: 'text-green border-green',
        orange: 'text-orange border-orange',
      },
    },
    defaultVariants: {
      variant: 'tier',
    },
  },
)

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
