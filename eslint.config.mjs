import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * Flat config consuming eslint-config-next 16's native flat exports directly
 * (no FlatCompat bridge — the bridge crashes on next 16's nested plugin objects).
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'drizzle/**',
      'tests/e2e/**',
      'coverage/**',
    ],
  },
]

export default eslintConfig
