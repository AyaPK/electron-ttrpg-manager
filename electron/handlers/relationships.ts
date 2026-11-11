import { ipcMain } from 'electron'
import { eq, or } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database'
import { relationships, entities } from '../schema'

export function registerRelationshipHandlers() {
  ipcMain.handle('relationships:list', async (_event, entityId: string) => {
    const db = getDb()
    const rows = await db.select().from(relationships).where(
      or(
        eq(relationships.sourceEntityId, entityId),
        eq(relationships.targetEntityId, entityId)
      )
    )
    const enriched = await Promise.all(rows.map(async (rel) => {
      const [source] = await db.select().from(entities).where(eq(entities.id, rel.sourceEntityId))
      const [target] = await db.select().from(entities).where(eq(entities.id, rel.targetEntityId))
      return { ...rel, sourceEntity: source ?? null, targetEntity: target ?? null }
    }))
    return enriched
  })

  ipcMain.handle('relationships:listByCampaign', async (_event, campaignId: string) => {
    const db = getDb()
    return db.select().from(relationships).where(eq(relationships.campaignId, campaignId))
  })

  ipcMain.handle('relationships:create', async (_event, data: {
    campaignId: string
    sourceEntityId: string
    targetEntityId: string
    relationshipType: string
    description?: string
  }) => {
    const db = getDb()
    const now = new Date().toISOString()
    const rel = {
      id: uuidv4(),
      campaignId: data.campaignId,
      sourceEntityId: data.sourceEntityId,
      targetEntityId: data.targetEntityId,
      relationshipType: data.relationshipType,
      description: data.description ?? '',
      createdAt: now,
    }
    await db.insert(relationships).values(rel)
    return rel
  })

  ipcMain.handle('relationships:delete', async (_event, id: string) => {
    const db = getDb()
    await db.delete(relationships).where(eq(relationships.id, id))
    return { success: true }
  })
}
