import { describe, expect, it } from 'vitest'

import { locales } from './routing'

/**
 * i18n missing-key CI guard (T8 · plan "i18n/routing high — missing-key CI guard").
 *
 * `i18n/request.ts` loads one file per namespace per locale and swallows a
 * missing file so an incremental build never crashes. That safety net would
 * otherwise let a translator ship `es/landing.json` without the matching key in
 * `en/landing.json` and the gap would only surface at runtime as a raw key.
 *
 * This guard makes the gap a CI failure instead: for every namespace, the full
 * set of leaf key-paths must be identical across all locales. It also asserts no
 * value is an empty string (an empty translation is a silent failure too).
 *
 * The namespace list is kept in lock-step with `i18n/request.ts`'s NAMESPACES.
 */
const NAMESPACES = ['common', 'landing', 'enterprise', 'app', 'perfil'] as const

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

/** Flatten an object into dot-joined leaf paths (arrays indexed). */
function leafPaths(value: Json, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix]
  }
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => leafPaths(v, `${prefix}[${i}]`))
  }
  return Object.entries(value).flatMap(([k, v]) =>
    leafPaths(v, prefix ? `${prefix}.${k}` : k),
  )
}

/** Collect every leaf value (for the empty-string check). */
function leafValues(value: Json): Json[] {
  if (value === null || typeof value !== 'object') return [value]
  if (Array.isArray(value)) return value.flatMap(leafValues)
  return Object.values(value).flatMap(leafValues)
}

async function loadNamespace(
  locale: string,
  namespace: string,
): Promise<Record<string, Json>> {
  const mod = await import(`../messages/${locale}/${namespace}.json`)
  return mod.default as Record<string, Json>
}

describe('i18n message parity', () => {
  for (const namespace of NAMESPACES) {
    it(`every locale exposes the same key-paths for "${namespace}"`, async () => {
      const byLocale = await Promise.all(
        locales.map(async (locale) => ({
          locale,
          keys: new Set(leafPaths(await loadNamespace(locale, namespace))),
        })),
      )

      const [reference, ...rest] = byLocale
      for (const other of rest) {
        const missingInOther = [...reference.keys].filter(
          (k) => !other.keys.has(k),
        )
        const extraInOther = [...other.keys].filter(
          (k) => !reference.keys.has(k),
        )
        expect(
          missingInOther,
          `keys present in "${reference.locale}/${namespace}" but missing in "${other.locale}/${namespace}"`,
        ).toEqual([])
        expect(
          extraInOther,
          `keys present in "${other.locale}/${namespace}" but missing in "${reference.locale}/${namespace}"`,
        ).toEqual([])
      }
    })

    it(`"${namespace}" has no empty-string translations in any locale`, async () => {
      for (const locale of locales) {
        const values = leafValues(await loadNamespace(locale, namespace))
        const empties = values.filter((v) => v === '')
        expect(
          empties,
          `empty-string value(s) found in "${locale}/${namespace}"`,
        ).toEqual([])
      }
    })
  }
})
