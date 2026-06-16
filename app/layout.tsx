import type { ReactNode } from 'react'

/**
 * Root layout. Next requires a root layout, but the real <html>/<body> and the
 * locale provider live in `app/[locale]/layout.tsx` (locale is a route param).
 * This passthrough exists only to satisfy the App Router contract.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
