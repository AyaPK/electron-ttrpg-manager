import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import path from 'path'

let sqlite: Database.Database | null = null
let db: ReturnType<typeof drizzle> | null = null

export function initialiseDatabase(): void {
  if (db) {
    return
  }

  const dbPath = path.join(app.getPath('userData'), 'campaign-manager.db')

  sqlite = new Database(dbPath)
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')

  db = drizzle(sqlite)
}

export function getDatabase(): ReturnType<typeof drizzle> {
  if (!db) {
    throw new Error('Database has not been initialised. Call initialiseDatabase() during app startup.')
  }
  return db
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    db = null
  }
}
