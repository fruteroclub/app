import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Locale-aware navigation primitives. Use these (`Link`, `useRouter`,
 * `usePathname`, `redirect`, `getPathname`) instead of the bare next/navigation
 * equivalents so `localePrefix: 'as-needed'` is honored everywhere.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
