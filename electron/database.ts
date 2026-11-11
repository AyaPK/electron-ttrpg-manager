import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import * as schema from './schema'

let db: ReturnType<typeof drizzle>
let sqlite: Database.Database

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'campaign-manager.db')

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  runMigrations()

  return db
}

function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      system TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('npc', 'location', 'faction', 'item')),
      visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
      description TEXT NOT NULL DEFAULT '',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      source_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      target_entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      relationship_type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entities_campaign ON entities(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
    CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_entity_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_entity_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_campaign ON relationships(campaign_id);
  `)
}

export function closeDatabase() {
  if (sqlite) {
    sqlite.close()
  }
}
