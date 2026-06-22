import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Badge } from '@/components/ui'

describe('Badge', () => {
  it('renders content', () => {
    render(<Badge variant="solid">CONTRIBUTOR</Badge>)
    expect(screen.getByText('CONTRIBUTOR')).toBeInTheDocument()
  })

  it('solid variant is the signature badge (purple block + hard border, FLAT)', () => {
    render(<Badge variant="solid">CONTRIBUTOR</Badge>)
    const el = screen.getByText('CONTRIBUTOR')
    expect(el.className).toContain('bg-purple')
    expect(el.className).toContain('border-black')
    // Offset shadows removed from the design system (2026-06-20) — borders only.
    expect(el.className).not.toContain('shadow-hard')
  })

  it('tier variant is a hairline-bordered chip without shadow', () => {
    render(<Badge variant="tier">RARE</Badge>)
    const el = screen.getByText('RARE')
    expect(el.className).toContain('bg-purple')
    expect(el.className).not.toContain('shadow-hard-sm')
  })

  it('accent tone maps to the per-dimension color', () => {
    render(
      <Badge variant="accent" tone="green">
        02 Events
      </Badge>,
    )
    const el = screen.getByText('02 Events')
    expect(el.className).toContain('text-green')
    expect(el.className).toContain('border-green')
  })
})
