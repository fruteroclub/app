/**
 * Database client — Neon serverless Postgres via postgres.js + drizzle-orm.
 *
 * Connection strategy (mirrors `code/frutero-current-app` config, no product code):
 *  - `DATABASE_URL`          pooled connection for application queries
 *  - `DATABASE_URL_UNPOOLED` direct connection for migrations (drizzle-kit)
 *
 * No silent failures: a missing `DATABASE_URL` throws on first use with a clear
 * message rather than handing back an undefined client. The client is created
 * lazily so build-time (no env) and test (mocked) paths don't crash on import.
 */
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'
import * as schema from './schema'

export { schema }

declare global {
  // Reuse one pool across hot-reloads / lambda invocations in the same process.
  var __clubPgSql: Sql | undefined
  var __clubDb: PostgresJsDatabase<typeof schema> | undefined
}

function requireUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. The app requires a pooled Postgres connection ' +
        '(Neon). Set DATABASE_URL (and DATABASE_URL_UNPOOLED for migrations) ' +
        'in your environment.',
    )
  }
  return url
}

/** Pooled postgres.js client for application queries (idempotent per-process). */
export function getSql(): Sql {
  if (!globalThis.__clubPgSql) {
    globalThis.__clubPgSql = postgres(requireUrl(), {
      max: 10,
      // postgres.js disables prepared statements automatically when needed;
      // Neon's pooler (PgBouncer) is happiest with prepare:false.
      prepare: false,
    })
  }
  return globalThis.__clubPgSql
}

/**
 * Drizzle DB handle for application code. Lazy: accessing `db.<table>` triggers
 * the pooled connection only when a query actually runs.
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!globalThis.__clubDb) {
    globalThis.__clubDb = drizzle(getSql(), { schema })
  }
  return globalThis.__clubDb
}

/**
 * Convenience proxy so callers can `import { db } from '@/lib/db/client'` and use
 * `db.select()...` directly. The underlying client is still created lazily.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

/** Close the pool (tests / graceful shutdown). */
export async function closeDatabase(): Promise<void> {
  if (globalThis.__clubPgSql) {
    await globalThis.__clubPgSql.end({ timeout: 5 })
    globalThis.__clubPgSql = undefined
    globalThis.__clubDb = undefined
  }
}
