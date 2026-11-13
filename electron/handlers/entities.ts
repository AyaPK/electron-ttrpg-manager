import { ipcMain } from 'electron'
import {
  createEntity,
  getEntities,
  getEntityById,
  updateEntity,
  deleteEntity,
} from '../../src/main/entities/entityService'
import type { EntityFilter } from '../../src/main/entities/entityService'
import type { EntityType } from '../../src/main/entities/entityTypes'

export function registerEntityHandlers() {
  ipcMain.handle('entities:list', (
    _event,
    campaignId: string,
    filters?: EntityFilter,
  ) => getEntities(campaignId, filters))

  ipcMain.handle('entities:get', (
    _event,
    id: string,
    campaignId: string,
  ) => getEntityById(id, campaignId))

  ipcMain.handle('entities:create', (
    _event,
    data: {
      campaignId: string
      type: EntityType
      name: string
      description?: string
      visibility?: 'private' | 'campaign' | 'players'
      metadata: Record<string, unknown>
    },
  ) => createEntity(data as Parameters<typeof createEntity>[0]))

  ipcMain.handle('entities:update', (
    _event,
    id: string,
    campaignId: string,
    data: {
      name?: string
      description?: string
      visibility?: 'private' | 'campaign' | 'players'
      metadata?: Record<string, unknown>
    },
  ) => updateEntity(id, campaignId, data as Parameters<typeof updateEntity>[2]))

  ipcMain.handle('entities:delete', async (
    _event,
    id: string,
    campaignId: string,
  ) => {
    await deleteEntity(id, campaignId)
    return { success: true }
  })

  ipcMain.handle('entities:counts', async (
    _event,
    campaignId: string,
  ) => {
    const list = await getEntities(campaignId)
    const counts = { npc: 0, location: 0, faction: 0, item: 0, monster: 0, player: 0, spell: 0, total: list.length }
    for (const e of list) {
      counts[e.type]++
    }
    return counts
  })
}
