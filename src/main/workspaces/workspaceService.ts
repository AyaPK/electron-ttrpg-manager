import { randomUUID } from 'crypto'
import { getDatabase } from '../database/connection'
import { workspaces } from '../database/schema'
import type { Workspace } from '../database/schema'

let activeWorkspace: Workspace | null = null

export async function initialiseWorkspace(): Promise<void> {
  const db = getDatabase()
  const rows = await db.select().from(workspaces).limit(1)

  if (rows.length > 0) {
    activeWorkspace = rows[0]
    return
  }

  const now = Date.now()
  const created: Workspace = {
    id: randomUUID(),
    name: 'Default Workspace',
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(workspaces).values(created)
  activeWorkspace = created
}

export function getActiveWorkspace(): Workspace {
  if (!activeWorkspace) {
    throw new Error('Workspace has not been initialised. Call initialiseWorkspace() during app startup.')
  }
  return activeWorkspace
}
