import { ipcMain } from 'electron'
import {
  createRelationship,
  getRelationshipsByEntity,
  getRelationshipsByCampaign,
  deleteRelationship,
} from '../../src/main/relationships/relationshipService'
import type { CreateRelationshipInput } from '../../src/main/relationships/relationshipService'

export function registerRelationshipHandlers() {
  ipcMain.handle('relationships:list', (
    _event,
    entityId: string,
  ) => getRelationshipsByEntity(entityId))

  ipcMain.handle('relationships:listByCampaign', (
    _event,
    campaignId: string,
  ) => getRelationshipsByCampaign(campaignId))

  ipcMain.handle('relationships:create', (
    _event,
    data: CreateRelationshipInput,
  ) => createRelationship(data))

  ipcMain.handle('relationships:delete', async (
    _event,
    id: string,
    campaignId: string,
  ) => {
    await deleteRelationship(id, campaignId)
    return { success: true }
  })
}
