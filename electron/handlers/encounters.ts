import { ipcMain } from 'electron'
import {
  createEncounter,
  getEncountersByCampaign,
  getEncounter,
  updateEncounter,
  deleteEncounter,
  createGroup,
  updateGroup,
  deleteGroup,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../../src/main/encounters/encounterService'

export function registerEncounterHandlers() {
  ipcMain.handle('encounters:list', (_event, campaignId: string) =>
    getEncountersByCampaign(campaignId),
  )

  ipcMain.handle('encounters:get', (_event, id: string, campaignId: string) =>
    getEncounter(id, campaignId),
  )

  ipcMain.handle(
    'encounters:create',
    (_event, data: { campaignId: string; name: string; description?: string; notes?: string }) =>
      createEncounter(data),
  )

  ipcMain.handle(
    'encounters:update',
    (_event, id: string, campaignId: string, data: { name?: string; description?: string; notes?: string; status?: 'draft' | 'ready' | 'complete' }) =>
      updateEncounter(id, campaignId, data),
  )

  ipcMain.handle('encounters:delete', (_event, id: string, campaignId: string) =>
    deleteEncounter(id, campaignId).then(() => ({ success: true })),
  )

  ipcMain.handle(
    'encounters:createGroup',
    (_event, data: { encounterId: string; name: string; sortOrder?: number }) =>
      createGroup({ ...data, sortOrder: data.sortOrder ?? 0 }),
  )

  ipcMain.handle(
    'encounters:updateGroup',
    (_event, id: string, data: { name?: string; sortOrder?: number }) =>
      updateGroup(id, data),
  )

  ipcMain.handle('encounters:deleteGroup', (_event, id: string) =>
    deleteGroup(id).then(() => ({ success: true })),
  )

  ipcMain.handle(
    'encounters:createEntry',
    (_event, data: { groupId: string; encounterId: string; name: string; cr?: string; count?: number; notes?: string; sortOrder?: number }) =>
      createEntry({ ...data, cr: data.cr ?? '1', count: data.count ?? 1, sortOrder: data.sortOrder ?? 0 }),
  )

  ipcMain.handle(
    'encounters:updateEntry',
    (_event, id: string, data: { name?: string; cr?: string; count?: number; notes?: string; sortOrder?: number }) =>
      updateEntry(id, data),
  )

  ipcMain.handle('encounters:deleteEntry', (_event, id: string) =>
    deleteEntry(id).then(() => ({ success: true })),
  )
}
