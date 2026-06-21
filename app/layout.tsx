import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Root layout. Next requires a root layout, but the real <html>/<body> and the
 * locale provider live in `app/[locale]/layout.tsx` (locale is a route param).
 * This passthrough exists only to satisfy the App Router contract.
 *
 * `metadataBase` is declared here (the topmost segment) so the file-convention
 * `opengraph-image` route resolves against the production origin instead of
 * falling back to `http://localhost:3000` during the build.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
