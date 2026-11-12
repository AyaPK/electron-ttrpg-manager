import { contextBridge, ipcRenderer } from 'electron'

const api = {
  campaigns: {
    list: () => ipcRenderer.invoke('campaigns:list'),
    get: (id: string) => ipcRenderer.invoke('campaigns:get', id),
    create: (data: { name: string; description: string; system: string }) =>
      ipcRenderer.invoke('campaigns:create', data),
    update: (id: string, data: { name?: string; description?: string; system?: string }) =>
      ipcRenderer.invoke('campaigns:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('campaigns:delete', id),
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
    delete: (id: string) => ipcRenderer.invoke('relationships:delete', id),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
