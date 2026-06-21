import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Avatar — square hard-framed builder avatar (DESIGN.md → Components, Iconography).
 *
 * A signature element: hard ink border + offset shadow. When no image is present
 * it renders a 45deg halftone/riso striped duotone placeholder in the dimension
 * color (the preview `.av.a/.b/.c` / `.av1..av4` pattern), giving the print look
 * before real photos land. Real images get the same square hard frame.
 */
const STRIPE: Record<NonNullable<AvatarProps['tone']>, string> = {
  magenta:
    'repeating-linear-gradient(45deg,var(--magenta),var(--magenta) 6px,#a8067a 6px,#a8067a 12px)',
  green:
    'repeating-linear-gradient(45deg,var(--green),var(--green) 6px,#138a51 6px,#138a51 12px)',
  orange:
    'repeating-linear-gradient(45deg,var(--orange),var(--orange) 6px,#d97c00 6px,#d97c00 12px)',
  muted:
    'repeating-linear-gradient(45deg,var(--muted-canonical),var(--muted-canonical) 6px,#241c38 6px,#241c38 12px)',
}

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Optional image URL. When absent, a halftone placeholder is shown. */
  src?: string
  alt?: string
  /** px size (square). Default 46 (directory card size). */
  size?: number
  /** Halftone placeholder color when there is no src. */
  tone?: 'magenta' | 'green' | 'orange' | 'muted'
}

function Avatar({
  src,
  alt = '',
  size = 46,
  tone = 'magenta',
  className,
  style,
  ...props
}: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      role="img"
      aria-label={alt || undefined}
      className={cn(
        'inline-block flex-none border-[1.5px] border-black bg-cover bg-center',
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-card)',
        backgroundImage: src ? `url(${src})` : STRIPE[tone],
        ...style,
      }}
      {...props}
    />
  )
}

export { Avatar }
