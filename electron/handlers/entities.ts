import { ipcMain } from 'electron'
import { eq, and, like } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../src/main/database/connection'
import { entities } from '../schema'
import type { EntityType } from '../schema'

export function registerEntityHandlers() {
  ipcMain.handle('entities:list', async (_event, campaignId: string, filters?: { type?: EntityType; search?: string }) => {
    const db = getDatabase()
    let query = db.select().from(entities).where(eq(entities.campaignId, campaignId))

    if (filters?.type) {
      query = db.select().from(entities).where(
        and(eq(entities.campaignId, campaignId), eq(entities.type, filters.type))
      )
    }

    if (filters?.search) {
      query = db.select().from(entities).where(
        and(eq(entities.campaignId, campaignId), like(entities.name, `%${filters.search}%`))
      )
    }

    if (filters?.type && filters?.search) {
      query = db.select().from(entities).where(
        and(
          eq(entities.campaignId, campaignId),
          eq(entities.type, filters.type),
          like(entities.name, `%${filters.search}%`)
        )
      )
    }

    return query.orderBy(entities.updatedAt)
  })

  ipcMain.handle('entities:get', async (_event, id: string) => {
    const db = getDatabase()
    const result = await db.select().from(entities).where(eq(entities.id, id))
    return result[0] ?? null
  })

  ipcMain.handle('entities:create', async (_event, data: {
    campaignId: string
    name: string
    type: EntityType
    description?: string
    visibility?: 'public' | 'private'
    metadata?: Record<string, unknown>
  }) => {
    const db = getDatabase()
    const now = new Date().toISOString()
    const entity = {
      id: uuidv4(),
      campaignId: data.campaignId,
      name: data.name,
      type: data.type,
      visibility: data.visibility ?? 'public' as const,
      description: data.description ?? '',
      metadata: JSON.stringify(data.metadata ?? {}),
      createdAt: now,
      updatedAt: now,
    }
    await db.insert(entities).values(entity)
    return { ...entity, metadata: data.metadata ?? {} }
  })

  ipcMain.handle('entities:update', async (_event, id: string, data: {
    name?: string
    description?: string
    visibility?: 'public' | 'private'
    metadata?: Record<string, unknown>
  }) => {
    const db = getDatabase()
    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = { updatedAt: now }
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.visibility !== undefined) updateData.visibility = data.visibility
    if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata)

    await db.update(entities).set(updateData).where(eq(entities.id, id))
    const result = await db.select().from(entities).where(eq(entities.id, id))
    if (!result[0]) return null
    return { ...result[0], metadata: JSON.parse(result[0].metadata) }
  })

  ipcMain.handle('entities:delete', async (_event, id: string) => {
    const db = getDatabase()
    await db.delete(entities).where(eq(entities.id, id))
    return { success: true }
  })

  ipcMain.handle('entities:counts', async (_event, campaignId: string) => {
    const db = getDatabase()
    const all = await db.select().from(entities).where(eq(entities.campaignId, campaignId))
    const counts = { npc: 0, location: 0, faction: 0, item: 0, total: all.length }
    for (const e of all) {
      counts[e.type as EntityType]++
    }
    return counts
  })
}
