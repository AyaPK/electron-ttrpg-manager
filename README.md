# Campaign Manager

A desktop application for creating tabletop RPG campaigns, managing worldbuilding entities, and linking them together. Built as a vertical slice to prove the application architecture and data model before introducing maps, timelines, session planning, or collaboration.

## What it does

The application lets you create campaigns and populate them with four entity types: NPCs, locations, factions, and items. Entities share a common structure (UUID, campaign ID, name, type, visibility, timestamps) and store type-specific fields as validated metadata. Entities can be linked through typed relationships that are navigable from either end. Descriptions use a rich-text editor. All data persists locally via SQLite.

## Stack

| Area | Technology |
|---|---|
| Desktop runtime | Electron |
| Language | TypeScript |
| UI | React |
| Build tooling | Vite + vite-plugin-electron |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle |
| Validation | Zod |
| Rich text | TipTap |
| UI state | Zustand |
| Icons | Lucide |
| Packaging | electron-builder |

## Architecture

The codebase is split into three execution areas:

**`electron/`** — Main process. Owns the SQLite database, runs all IPC handlers, and handles privileged operations. Database schema is defined with Drizzle in `electron/schema.ts` and migrations run inline at startup via raw SQL in `electron/database.ts`. IPC handlers are grouped by domain under `electron/handlers/`.

**`electron/preload.ts`** — Typed IPC bridge. Exposes a strongly typed `window.api` object to the renderer via `contextBridge`. No node APIs leak into the renderer.

**`src/`** — Renderer process. A React application using Zustand for workspace and navigation state. All database access goes through `window.api`. Components are in `src/components/`, the Zustand store is in `src/store/useAppStore.ts`, and the shared type declarations for the IPC bridge live in `src/types/electron.d.ts`.

## Getting started

```bash
npm install
npm run dev
```

This starts Vite in watch mode and launches Electron. The renderer hot-reloads on change; changes to the main process or preload require restarting the dev command.

## Building a distributable

```bash
npm run package
```

Runs `vite build`, compiles the Electron TypeScript, then invokes `electron-builder`. Output goes to `release/`.

## Data storage

The SQLite database is written to the Electron user data directory:

- **Windows:** `%APPDATA%\campaign-manager\campaign-manager.db`
- **macOS:** `~/Library/Application Support/campaign-manager/campaign-manager.db`
- **Linux:** `~/.config/campaign-manager/campaign-manager.db`

WAL mode and foreign key enforcement are enabled at startup.

