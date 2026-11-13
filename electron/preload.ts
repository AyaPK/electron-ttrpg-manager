import { contextBridge, ipcRenderer } from 'electron'

const api = {
  campaigns: {
    list: () => ipcRenderer.invoke('campaigns:list'),
    get: (id: string) => ipcRenderer.invoke('campaigns:get', id),
    create: (data: { name: string; description: string; system: string }) =>
      ipcRenderer.invoke('campaigns:create', data),
    update: (id: string, data: { name?: string; description?: string; system?: string; backgroundImage?: string | null }) =>
      ipcRenderer.invoke('campaigns:update', id, data),
    pickImage: () => ipcRenderer.invoke('campaigns:pickImage'),
    delete: (id: string) => ipcRenderer.invoke('campaigns:delete', id),
    seedMonsters: (campaignId: string) => ipcRenderer.invoke('campaigns:seedMonsters', campaignId),
    seedSpells: (campaignId: string) => ipcRenderer.invoke('campaigns:seedSpells', campaignId),
  },
  entities: {
    list: (campaignId: string, filters?: { type?: string; search?: string }) =>
      ipcRenderer.invoke('entities:list', campaignId, filters),
    get: (id: string, campaignId: string) =>
      ipcRenderer.invoke('entities:get', id, campaignId),
    create: (data: {
      campaignId: string
      type: string
      name: string
      description?: string
      visibility?: string
      metadata: Record<string, unknown>
    }) => ipcRenderer.invoke('entities:create', data),
    update: (id: string, campaignId: string, data: {
      name?: string
      description?: string
      visibility?: string
      metadata?: Record<string, unknown>
    }) => ipcRenderer.invoke('entities:update', id, campaignId, data),
    delete: (id: string, campaignId: string) =>
      ipcRenderer.invoke('entities:delete', id, campaignId),
    counts: (campaignId: string) => ipcRenderer.invoke('entities:counts', campaignId),
  },
  relationships: {
    list: (entityId: string) => ipcRenderer.invoke('relationships:list', entityId),
    listByCampaign: (campaignId: string) => ipcRenderer.invoke('relationships:listByCampaign', campaignId),
    create: (data: {
      campaignId: string
      sourceEntityId: string
      targetEntityId: string
      relationshipType: string
      description?: string
    }) => ipcRenderer.invoke('relationships:create', data),
    delete: (id: string, campaignId: string) => ipcRenderer.invoke('relationships:delete', id, campaignId),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
  encounters: {
    list: (campaignId: string) => ipcRenderer.invoke('encounters:list', campaignId),
    get: (id: string, campaignId: string) => ipcRenderer.invoke('encounters:get', id, campaignId),
    create: (data: { campaignId: string; name: string; description?: string; notes?: string }) =>
      ipcRenderer.invoke('encounters:create', data),
    update: (id: string, campaignId: string, data: { name?: string; description?: string; notes?: string; status?: string }) =>
      ipcRenderer.invoke('encounters:update', id, campaignId, data),
    delete: (id: string, campaignId: string) => ipcRenderer.invoke('encounters:delete', id, campaignId),
    createGroup: (data: { encounterId: string; name: string; sortOrder?: number }) =>
      ipcRenderer.invoke('encounters:createGroup', data),
    updateGroup: (id: string, data: { name?: string; sortOrder?: number }) =>
      ipcRenderer.invoke('encounters:updateGroup', id, data),
    deleteGroup: (id: string) => ipcRenderer.invoke('encounters:deleteGroup', id),
    createEntry: (data: { groupId: string; encounterId: string; name: string; cr?: string; count?: number; notes?: string; sortOrder?: number }) =>
      ipcRenderer.invoke('encounters:createEntry', data),
    updateEntry: (id: string, data: { name?: string; cr?: string; count?: number; notes?: string }) =>
      ipcRenderer.invoke('encounters:updateEntry', id, data),
    deleteEntry: (id: string) => ipcRenderer.invoke('encounters:deleteEntry', id),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
