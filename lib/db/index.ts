/**
 * Database barrel — single import surface for app code (parity with
 * `code/frutero-current-app` where `lib/db/index.ts` exports `db` + tables).
 *
 *   import { db, profiles, leads } from '@/lib/db'
 */
export { db, getDb, getSql, closeDatabase } from './client'
export * from './schema'
