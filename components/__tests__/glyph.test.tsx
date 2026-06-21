import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { Glyph, GlyphDefs, GLYPH_NAMES } from '@/components/Glyph'

describe('Glyph', () => {
  it('exposes the expected named glyph set', () => {
    expect([...GLYPH_NAMES]).toEqual([
      'target',
      'grid',
      'hex',
      'bolt',
      'star',
      'diamond',
      'search',
      'mark',
    ])
  })

  it('references the correct sprite symbol by name', () => {
    const { container } = render(<Glyph name="bolt" />)
    const use = container.querySelector('use')
    expect(use).not.toBeNull()
    expect(use?.getAttribute('href')).toBe('#g-bolt')
  })

  it('is decorative (aria-hidden) without a title', () => {
    const { container } = render(<Glyph name="hex" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg).not.toHaveAttribute('role')
  })

  it('becomes a labeled image when given a title', () => {
    const { container } = render(<Glyph name="star" title="favorito" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('favorito')
    expect(container.querySelector('title')?.textContent).toBe('favorito')
  })

  it('GlyphDefs renders a symbol for every name', () => {
    const { container } = render(<GlyphDefs />)
    for (const name of GLYPH_NAMES) {
      expect(container.querySelector(`#g-${name}`)).not.toBeNull()
    }
  })
})
