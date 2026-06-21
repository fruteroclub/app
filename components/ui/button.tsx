import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Button — the one CTA primitive (DESIGN.md → Components / Motion). Used by the
 * masthead, the hero, and the closing CTA band; reach for THIS, never hand-roll a
 * button with bespoke classes.
 *
 * primary: magenta + hard 2px ink border. FLAT on the marketing surface (editorial
 * publication — hover darkens). The neobrutalist offset shadow + lift are gated to
 * the arcade app (`html[data-mode=arcade]`): in the hacker-console app the button
 * gets the sticker shadow + hover lift; on the public publication it stays flat.
 * ghost: transparent, surface on hover. outline: hard-bordered neutral.
 *
 * `onDark`: set on dark marketing surfaces (the masthead's ink bar, the closing
 * CTA band). The black hard-border vanishes on dark, so primary's border flips to
 * magenta and outline/ghost flip to white — same component, dark-aware.
 *
 * Sizes never use text-sm (a CTA reads at text-base on lg; md/sm are for compact
 * nav/utility actions).
 *
 * `asChild` renders the single child (e.g. a next-intl <Link>) with the button
 * classes merged in (Radix Slot), so landing CTAs stay anchors.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono font-semibold uppercase tracking-[0.07em] no-underline cursor-pointer select-none transition-[transform,box-shadow,background,color,border-color] duration-75 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta',
  {
    variants: {
      variant: {
        // magenta fill; the border MATCHES the fill (a clean magenta pill) on BOTH
        // light and dark surfaces, so the CTA reads identically in the hero and the
        // masthead. The border darkens with the fill on hover so they stay in sync.
        primary:
          'text-white bg-magenta border-2 border-magenta hover:bg-[color-mix(in_srgb,var(--magenta)_88%,var(--black))] hover:border-[color-mix(in_srgb,var(--magenta)_88%,var(--black))]',
        // transparent → surface on hover, no shadow
        ghost:
          'text-ink bg-transparent border-2 border-transparent hover:bg-surface',
        // hard-bordered neutral (e.g. "MODO"/load-more) — outline only
        outline:
          'text-ink bg-transparent border-2 border-ink hover:bg-ink hover:text-paper',
        // behaves like a link: no fill/border, only the label goes magenta on hover
        // (keeps the size padding so it lines up beside a primary).
        link: 'text-ink bg-transparent border-2 border-transparent hover:text-magenta',
      },
      // Font size scales with the size (shadcn-style); spacing on the even Tailwind
      // scale, no arbitrary px values.
      size: {
        sm: 'px-3 py-2 text-xs', // 12 / 8
        md: 'h-10 px-3 py-1.5 text-sm', // default — 40px, the minimum button height
        lg: 'px-6 py-4 text-base', // 24 / 16
      },
      // Dark marketing surfaces (masthead ink bar, closing CTA band).
      onDark: { true: '', false: '' },
    },
    compoundVariants: [
      // primary needs no onDark border override — it's already a magenta pill on both
      // surfaces. Outline on dark = white border + white label, invert on hover.
      {
        variant: 'outline',
        onDark: true,
        class: 'border-white text-white hover:bg-white hover:text-[#11091e]',
      },
      // Ghost on dark = light label.
      {
        variant: 'ghost',
        onDark: true,
        class: 'text-white hover:bg-white/10',
      },
      // Link on dark = light label, still magenta on hover.
      {
        variant: 'link',
        onDark: true,
        class: 'text-white hover:text-magenta',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      onDark: false,
    },
  },
)

type ButtonOwnProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonOwnProps

function Button({
  className,
  variant,
  size,
  onDark,
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, onDark }), className)}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
