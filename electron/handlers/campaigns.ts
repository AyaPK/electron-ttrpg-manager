import { ipcMain, dialog } from 'electron'
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from '../../src/main/campaigns/campaignService'
import { seedMonstersForCampaign } from '../../src/main/entities/monsterSeedService'
import { seedSpellsForCampaign } from '../../src/main/entities/spellSeedService'

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

  ipcMain.handle('campaigns:update', (_event, id: string, data: { name?: string; description?: string; system?: string; backgroundImage?: string | null }) =>
    updateCampaign(id, data)
  )

  ipcMain.handle('campaigns:delete', async (_event, id: string) => {
    await deleteCampaign(id)
    return { success: true }
  })

  ipcMain.handle('campaigns:seedMonsters', async (_event, campaignId: string) => {
    const count = await seedMonstersForCampaign(campaignId)
    return { seeded: count }
  })

  ipcMain.handle('campaigns:seedSpells', async (_event, campaignId: string) => {
    const count = await seedSpellsForCampaign(campaignId)
    return { seeded: count }
  })

  ipcMain.handle('campaigns:pickImage', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose Campaign Background',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

}
