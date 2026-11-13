let electron = require("electron");
// electron/preload.ts
electron.contextBridge.exposeInMainWorld("api", {
	campaigns: {
		list: () => electron.ipcRenderer.invoke("campaigns:list"),
		get: (id) => electron.ipcRenderer.invoke("campaigns:get", id),
		create: (data) => electron.ipcRenderer.invoke("campaigns:create", data),
		update: (id, data) => electron.ipcRenderer.invoke("campaigns:update", id, data),
		pickImage: () => electron.ipcRenderer.invoke("campaigns:pickImage"),
		delete: (id) => electron.ipcRenderer.invoke("campaigns:delete", id),
		seedMonsters: (campaignId) => electron.ipcRenderer.invoke("campaigns:seedMonsters", campaignId),
		seedSpells: (campaignId) => electron.ipcRenderer.invoke("campaigns:seedSpells", campaignId)
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
	},
	encounters: {
		list: (campaignId) => electron.ipcRenderer.invoke("encounters:list", campaignId),
		get: (id, campaignId) => electron.ipcRenderer.invoke("encounters:get", id, campaignId),
		create: (data) => electron.ipcRenderer.invoke("encounters:create", data),
		update: (id, campaignId, data) => electron.ipcRenderer.invoke("encounters:update", id, campaignId, data),
		delete: (id, campaignId) => electron.ipcRenderer.invoke("encounters:delete", id, campaignId),
		createGroup: (data) => electron.ipcRenderer.invoke("encounters:createGroup", data),
		updateGroup: (id, data) => electron.ipcRenderer.invoke("encounters:updateGroup", id, data),
		deleteGroup: (id) => electron.ipcRenderer.invoke("encounters:deleteGroup", id),
		createEntry: (data) => electron.ipcRenderer.invoke("encounters:createEntry", data),
		updateEntry: (id, data) => electron.ipcRenderer.invoke("encounters:updateEntry", id, data),
		deleteEntry: (id) => electron.ipcRenderer.invoke("encounters:deleteEntry", id)
	}
});
