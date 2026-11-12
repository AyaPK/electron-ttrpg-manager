let electron = require("electron");
// electron/preload.ts
electron.contextBridge.exposeInMainWorld("api", {
	campaigns: {
		list: () => electron.ipcRenderer.invoke("campaigns:list"),
		get: (id) => electron.ipcRenderer.invoke("campaigns:get", id),
		create: (data) => electron.ipcRenderer.invoke("campaigns:create", data),
		update: (id, data) => electron.ipcRenderer.invoke("campaigns:update", id, data),
		delete: (id) => electron.ipcRenderer.invoke("campaigns:delete", id)
	},
	entities: {
		list: (campaignId, filters) => electron.ipcRenderer.invoke("entities:list", campaignId, filters),
		get: (id, campaignId) => electron.ipcRenderer.invoke("entities:get", id, campaignId),
		create: (data) => electron.ipcRenderer.invoke("entities:create", data),
		update: (id, campaignId, data) => electron.ipcRenderer.invoke("entities:update", id, campaignId, data),
		delete: (id, campaignId) => electron.ipcRenderer.invoke("entities:delete", id, campaignId),
		counts: (campaignId) => electron.ipcRenderer.invoke("entities:counts", campaignId)
	},
	relationships: {
		list: (entityId) => electron.ipcRenderer.invoke("relationships:list", entityId),
		listByCampaign: (campaignId) => electron.ipcRenderer.invoke("relationships:listByCampaign", campaignId),
		create: (data) => electron.ipcRenderer.invoke("relationships:create", data),
		delete: (id, campaignId) => electron.ipcRenderer.invoke("relationships:delete", id, campaignId)
	},
	settings: {
		get: (key) => electron.ipcRenderer.invoke("settings:get", key),
		set: (key, value) => electron.ipcRenderer.invoke("settings:set", key, value),
		getAll: () => electron.ipcRenderer.invoke("settings:getAll")
	}
});
