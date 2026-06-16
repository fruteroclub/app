import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing, type Locale } from './routing'

/**
 * Per-namespace message loading.
 *
 * Translations are split into `messages/{locale}/<namespace>.json` so that
 * parallel build tasks can own disjoint copy files (T5 owns `landing`, T6 owns
 * `enterprise`, etc.) instead of racing on one shared `messages/{locale}.json`.
 *
 * Each namespace file's contents are mounted under a top-level key matching the
 * file name, e.g. `messages/es/common.json` → `t('common.…')`.
 *
 * Add a namespace here when a task introduces a new `messages/{locale}/<ns>.json`.
 * Keeping the list explicit (rather than a filesystem glob) keeps the loader
 * statically analyzable for the bundler and avoids shipping stray files.
 */
const NAMESPACES = ['common', 'landing', 'enterprise', 'app'] as const

async function loadNamespace(
  locale: Locale,
  namespace: string,
): Promise<Record<string, unknown>> {
  try {
    const mod = await import(`../messages/${locale}/${namespace}.json`)
    return mod.default as Record<string, unknown>
  } catch {
    // A namespace may not exist yet for a locale during incremental build-out.
    // Missing-key surfacing is handled by next-intl + the CI guard, not silently.
    return {}
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const loaded = await Promise.all(
    NAMESPACES.map((ns) => loadNamespace(locale, ns)),
  )

  const messages = NAMESPACES.reduce<Record<string, unknown>>(
    (acc, ns, idx) => {
      acc[ns] = loaded[idx]
      return acc
    },
    {},
  )

  return { locale, messages }
})
