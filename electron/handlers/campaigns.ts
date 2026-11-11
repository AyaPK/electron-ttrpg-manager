import { ipcMain } from 'electron'
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from '../../src/main/campaigns/campaignService'

export function registerCampaignHandlers() {
  ipcMain.handle('campaigns:list', () =>
    getCampaigns()
  )

  ipcMain.handle('campaigns:get', (_event, id: string) =>
    getCampaignById(id)
  )

  ipcMain.handle('campaigns:create', (_event, data: { name: string; description?: string; system?: string }) =>
    createCampaign(data)
  )

  ipcMain.handle('campaigns:update', (_event, id: string, data: { name?: string; description?: string; system?: string }) =>
    updateCampaign(id, data)
  )

  ipcMain.handle('campaigns:delete', async (_event, id: string) => {
    await deleteCampaign(id)
    return { success: true }
  })
}
