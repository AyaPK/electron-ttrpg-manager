import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../database'
import { campaigns } from '../schema'

export function registerCampaignHandlers() {
  ipcMain.handle('campaigns:list', async () => {
    const db = getDb()
    return db.select().from(campaigns).orderBy(campaigns.updatedAt)
  })

  ipcMain.handle('campaigns:get', async (_event, id: string) => {
    const db = getDb()
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id))
    return result[0] ?? null
  })

  ipcMain.handle('campaigns:create', async (_event, data: { name: string; description: string; system: string }) => {
    const db = getDb()
    const now = new Date().toISOString()
    const campaign = {
      id: uuidv4(),
      name: data.name,
      description: data.description ?? '',
      system: data.system ?? '',
      createdAt: now,
      updatedAt: now,
    }
    await db.insert(campaigns).values(campaign)
    return campaign
  })

  ipcMain.handle('campaigns:update', async (_event, id: string, data: { name?: string; description?: string; system?: string }) => {
    const db = getDb()
    const now = new Date().toISOString()
    await db.update(campaigns)
      .set({ ...data, updatedAt: now })
      .where(eq(campaigns.id, id))
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id))
    return result[0] ?? null
  })

  ipcMain.handle('campaigns:delete', async (_event, id: string) => {
    const db = getDb()
    await db.delete(campaigns).where(eq(campaigns.id, id))
    return { success: true }
  })
}
