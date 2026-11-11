import { create } from 'zustand'
import type { Campaign, Entity, EntityType } from '../types/electron.d'

interface AppState {
  activeCampaignId: string | null
  activeCampaign: Campaign | null
  selectedEntityId: string | null
  view: 'campaign-select' | 'campaign-overview' | 'entity-list' | 'entity-detail' | 'settings'
  entityTypeFilter: EntityType | null
  searchQuery: string
  sidebarOpen: boolean

  setActiveCampaign: (campaign: Campaign | null) => void
  setSelectedEntity: (entity: Entity | null) => void
  setSelectedEntityId: (id: string | null) => void
  setView: (view: AppState['view']) => void
  setEntityTypeFilter: (type: EntityType | null) => void
  setSearchQuery: (q: string) => void
  toggleSidebar: () => void
  navigateToEntity: (entityId: string) => void
  navigateToEntityList: (type?: EntityType | null) => void
  navigateToCampaignOverview: () => void
  navigateToCampaignSelect: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeCampaignId: null,
  activeCampaign: null,
  selectedEntityId: null,
  view: 'campaign-select',
  entityTypeFilter: null,
  searchQuery: '',
  sidebarOpen: true,

  setActiveCampaign: (campaign) =>
    set({
      activeCampaign: campaign,
      activeCampaignId: campaign?.id ?? null,
      view: campaign ? 'campaign-overview' : 'campaign-select',
      selectedEntityId: null,
    }),

  setSelectedEntity: (entity) =>
    set({
      selectedEntityId: entity?.id ?? null,
      view: entity ? 'entity-detail' : 'entity-list',
    }),

  setSelectedEntityId: (id) =>
    set({ selectedEntityId: id, view: id ? 'entity-detail' : 'entity-list' }),

  setView: (view) => set({ view }),

  setEntityTypeFilter: (type) => set({ entityTypeFilter: type }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  navigateToEntity: (entityId) =>
    set({ selectedEntityId: entityId, view: 'entity-detail', searchQuery: '' }),

  navigateToEntityList: (type = null) =>
    set({ view: 'entity-list', entityTypeFilter: type, selectedEntityId: null }),

  navigateToCampaignOverview: () =>
    set({ view: 'campaign-overview', selectedEntityId: null }),

  navigateToCampaignSelect: () =>
    set({
      view: 'campaign-select',
      activeCampaign: null,
      activeCampaignId: null,
      selectedEntityId: null,
    }),
}))
