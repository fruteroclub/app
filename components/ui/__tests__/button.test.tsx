import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '@/components/ui'

describe('Button', () => {
  it('renders its label and fires onClick (press)', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Crea tu perfil</Button>)
    const btn = screen.getByRole('button', { name: 'Crea tu perfil' })
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Nope' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('carries the flat neobrutalist signature on the primary variant', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button', { name: 'Primary' })
    // magenta fill + magenta border = a clean pill, identical on light + dark surfaces.
    // FLAT: offset shadows were removed from the design system (2026-06-20).
    expect(btn.className).toContain('bg-magenta')
    expect(btn.className).toContain('border-magenta')
    expect(btn.className).not.toContain('border-frame')
    expect(btn.className).not.toContain('shadow-hard')
    expect(btn.className).not.toContain('translate-y')
  })

  it('ghost variant drops the shadow', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button', { name: 'Ghost' })
    expect(btn.className).not.toContain('shadow-hard-sm')
    expect(btn.className).toContain('bg-transparent')
  })

  it('asChild renders the child element (anchor) with button classes', () => {
    render(
      <Button asChild>
        <a href="https://example.com/perfil">Link CTA</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Link CTA' })
    expect(link).toHaveAttribute('href', 'https://example.com/perfil')
    expect(link.className).toContain('bg-magenta')
    expect(link.getAttribute('data-slot')).toBe('button')
  })
})
