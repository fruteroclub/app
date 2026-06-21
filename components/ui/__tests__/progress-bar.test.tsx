import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ProgressBar, clampPercent } from '@/components/ui'

describe('clampPercent', () => {
  it('passes through in-range values', () => {
    expect(clampPercent(0)).toBe(0)
    expect(clampPercent(56)).toBe(56)
    expect(clampPercent(100)).toBe(100)
  })

  it('clamps below 0 and above 100', () => {
    expect(clampPercent(-20)).toBe(0)
    expect(clampPercent(180)).toBe(100)
  })

  it('treats NaN as 0', () => {
    expect(clampPercent(Number.NaN)).toBe(0)
  })
})

describe('ProgressBar', () => {
  it('exposes a clamped aria-valuenow and fill width', () => {
    render(<ProgressBar value={180} label="xp" />)
    const bar = screen.getByRole('progressbar', { name: 'xp' })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    const fill = bar.querySelector('[data-slot="progress-bar-fill"]')
    expect(fill).not.toBeNull()
    expect((fill as HTMLElement).style.width).toBe('100%')
  })

  it('clamps negatives to 0%', () => {
    render(<ProgressBar value={-5} label="neg" />)
    const bar = screen.getByRole('progressbar', { name: 'neg' })
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    const fill = bar.querySelector(
      '[data-slot="progress-bar-fill"]',
    ) as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('renders a mid-range value at its exact percent', () => {
    render(<ProgressBar value={56} label="mid" />)
    const bar = screen.getByRole('progressbar', { name: 'mid' })
    expect(bar).toHaveAttribute('aria-valuenow', '56')
  })
})
