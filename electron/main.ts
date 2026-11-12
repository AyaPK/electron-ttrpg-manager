import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { initialiseDatabase, closeDatabase } from '../src/main/database/connection'
import { initialiseWorkspace } from '../src/main/workspaces/workspaceService'
import { registerCampaignHandlers } from './handlers/campaigns'
import { registerEntityHandlers } from './handlers/entities'
import { registerRelationshipHandlers } from './handlers/relationships'
import { registerSettingsHandlers } from './handlers/settings'
import { registerEncounterHandlers } from './handlers/encounters'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Campaign Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#1a1a2e',
    show: false,
  })

  win.once('ready-to-show', () => {
    win?.show()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  initialiseDatabase()
  await initialiseWorkspace()
  registerCampaignHandlers()
  registerEntityHandlers()
  registerRelationshipHandlers()
  registerSettingsHandlers()
  registerEncounterHandlers()
  createWindow()
})

app.on('before-quit', () => {
  closeDatabase()
})
