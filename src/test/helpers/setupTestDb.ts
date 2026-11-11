import { beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import { _setDatabaseForTesting, closeDatabase, getDatabase } from '../../main/database/connection'
import { _setActiveWorkspaceForTesting } from '../../main/workspaces/workspaceService'
import { workspaces } from '../../main/database/schema'
import type { Workspace } from '../../main/database/schema'

const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../main/database/migrations')

export const TEST_WORKSPACE: Workspace = {
  id: 'test-workspace-id',
  name: 'Test Workspace',
  createdAt: 1_000_000,
  updatedAt: 1_000_000,
}

export function setupTestEnvironment(): void {
  beforeEach(() => {
    const sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    const tempDb = drizzle(sqlite)
    migrate(tempDb, { migrationsFolder: MIGRATIONS_FOLDER })

    _setDatabaseForTesting(sqlite)

    const db = getDatabase()
    db.insert(workspaces).values(TEST_WORKSPACE).run()

    _setActiveWorkspaceForTesting(TEST_WORKSPACE)
  })

  afterEach(() => {
    closeDatabase()
  })
}
