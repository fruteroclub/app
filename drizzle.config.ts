import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit config — migration-based workflow (db:generate → db:migrate).
 * NEVER db:push (corrupts migration tracking — mirrors frutero-current-app rule).
 *
 * Migrations run against the UNPOOLED direct connection; the app uses the pooled
 * one. Falls back to DATABASE_URL if the unpooled var is absent.
 */
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      '',
  },
  strict: true,
  verbose: true,
})
