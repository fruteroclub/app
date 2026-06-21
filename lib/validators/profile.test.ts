import { describe, it, expect } from 'vitest'

import { profileInputSchema } from './profile'

/**
 * Unit tests for the perfil input validator. Mirrors the DB CHECK constraints
 * (`lib/db/schema.ts`) so the 400 fires before the insert.
 */
describe('profileInputSchema', () => {
  const base = { handle: 'andres_frutero', displayName: 'Andrés Frutero' }

  it('accepts a minimal valid payload', () => {
    const r = profileInputSchema.safeParse(base)
    expect(r.success).toBe(true)
  })

  it('rejects a too-short handle', () => {
    expect(profileInputSchema.safeParse({ ...base, handle: 'no' }).success).toBe(
      false,
    )
  })

  it('rejects a handle with illegal characters', () => {
    expect(
      profileInputSchema.safeParse({ ...base, handle: 'bad handle!' }).success,
    ).toBe(false)
  })

  it('rejects an empty displayName', () => {
    expect(
      profileInputSchema.safeParse({ ...base, displayName: '' }).success,
    ).toBe(false)
  })

  it('rejects a bio over 280 chars', () => {
    expect(
      profileInputSchema.safeParse({ ...base, bio: 'x'.repeat(281) }).success,
    ).toBe(false)
  })

  it('drops empty link strings and keeps real ones', () => {
    const r = profileInputSchema.safeParse({
      ...base,
      links: { github: 'andresf', twitter: '' },
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.links.github).toBe('andresf')
      expect(r.data.links.twitter).toBeUndefined()
    }
  })

  it('rejects an invalid website URL', () => {
    expect(
      profileInputSchema.safeParse({
        ...base,
        links: { website: 'not-a-url' },
      }).success,
    ).toBe(false)
  })

  it('only accepts known locales', () => {
    expect(
      profileInputSchema.safeParse({ ...base, locale: 'fr' }).success,
    ).toBe(false)
    expect(
      profileInputSchema.safeParse({ ...base, locale: 'en' }).success,
    ).toBe(true)
  })
})
