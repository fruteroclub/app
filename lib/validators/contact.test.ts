import { describe, it, expect } from 'vitest'

import { contactInputSchema } from './contact'

/**
 * Unit tests for the contact/lead validator. Mirrors the DB CHECK constraints
 * (`lib/db/schema.ts` → `leads`) so the 400 fires before the insert.
 */
describe('contactInputSchema', () => {
  const base = {
    name: 'Ana López',
    email: 'ana@example.com',
    message: 'Hola, queremos construir.',
  }

  it('accepts a minimal valid payload', () => {
    expect(contactInputSchema.safeParse(base).success).toBe(true)
  })

  it('trims and keeps org optional', () => {
    const r = contactInputSchema.safeParse({ ...base, org: '  Acme  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.org).toBe('Acme')
  })

  it('drops an empty org to undefined', () => {
    const r = contactInputSchema.safeParse({ ...base, org: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.org).toBeUndefined()
  })

  it('rejects an empty name', () => {
    expect(contactInputSchema.safeParse({ ...base, name: '' }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(
      contactInputSchema.safeParse({ ...base, email: 'nope' }).success,
    ).toBe(false)
  })

  it('rejects an empty message', () => {
    expect(contactInputSchema.safeParse({ ...base, message: '' }).success).toBe(
      false,
    )
  })

  it('rejects a message over 2000 chars', () => {
    expect(
      contactInputSchema.safeParse({ ...base, message: 'x'.repeat(2001) })
        .success,
    ).toBe(false)
  })

  it('rejects an unknown source enum', () => {
    expect(
      contactInputSchema.safeParse({ ...base, source: 'spam' }).success,
    ).toBe(false)
  })

  it('rejects an unknown locale', () => {
    expect(
      contactInputSchema.safeParse({ ...base, locale: 'fr' }).success,
    ).toBe(false)
  })
})
