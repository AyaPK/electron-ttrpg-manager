import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
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

  const migrationsFolder = path.join(app.getAppPath(), 'src/main/database/migrations')

  try {
    migrate(db, { migrationsFolder })
  } catch (err) {
    sqlite.close()
    sqlite = null
    db = null
    throw new Error(`Database migration failed: ${(err as Error).message}`)
  }
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

export function _setDatabaseForTesting(instance: Database.Database): void {
  sqlite = instance
  db = drizzle(instance)
}
