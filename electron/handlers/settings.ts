import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { getDb } from '../database'
import { settings } from '../schema'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async (_event, key: string) => {
    const db = getDb()
    const result = await db.select().from(settings).where(eq(settings.key, key))
    return result[0]?.value ?? null
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    const db = getDb()
    await db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
    return { success: true }
  })

  ipcMain.handle('settings:getAll', async () => {
    const db = getDb()
    const rows = await db.select().from(settings)
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  })
}
