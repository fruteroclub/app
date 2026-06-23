import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // Security headers for Privy embedded wallets (pattern from frutero-current-app)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.privy.io https://*.privy.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https://auth.privy.io https://*.privy.io",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },

  // Only process these file extensions as pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // The content repo (`github:fruteroclub/content`) ships TypeScript source
  // (schema/article.ts — the ArticleMeta source of truth). Transpile it so Next
  // can consume the `.ts` exports directly without a build step in that repo.
  transpilePackages: ['@fruteroclub/content'],

  // Exclude problematic packages from server-side bundling.
  // The Privy embedded-wallet chain (@privy-io/react-auth → @reown/appkit →
  // walletconnect → pino → thread-stream) bundles dev test files that require
  // 'tape'/'tap' and break the build under Turbopack. Externalizing the logging
  // + appkit packages keeps them out of the bundle. Parity with frutero-current-app.
  serverExternalPackages: [
    'thread-stream',
    'pino',
    'pino-pretty',
    '@reown/appkit',
    '@privy-io/server-auth',
  ],
}

export default withNextIntl(nextConfig)
