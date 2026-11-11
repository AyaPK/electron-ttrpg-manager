import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { getDatabase } from '../../src/main/database/connection'
import { settings } from '../schema'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async (_event, key: string) => {
    const db = getDatabase()
    const result = await db.select().from(settings).where(eq(settings.key, key))
    return result[0]?.value ?? null
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    const db = getDatabase()
    await db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
    return { success: true }
  })

  ipcMain.handle('settings:getAll', async () => {
    const db = getDatabase()
    const rows = await db.select().from(settings)
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  })
}
