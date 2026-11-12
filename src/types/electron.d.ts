export interface Campaign {
  id: string
  workspaceId: string
  name: string
  description: string | null
  system: string | null
  createdAt: number
  updatedAt: number
}

export type EntityType = 'npc' | 'location' | 'faction' | 'item'
export type Visibility = 'private' | 'campaign' | 'players'

export interface NpcMetadata {
  type: 'npc'
  occupation?: string
  personality?: string
  race?: string
  affiliation?: string
}

export interface LocationMetadata {
  type: 'location'
  locationType?: string
  region?: string
  population?: string
}

export interface FactionMetadata {
  type: 'faction'
  goals?: string
  alignment?: string
  headquarters?: string
}

export interface ItemMetadata {
  type: 'item'
  itemType?: string
  rarity?: string
  attunement?: boolean
}

export type EntityMetadata = NpcMetadata | LocationMetadata | FactionMetadata | ItemMetadata

export interface Entity {
  id: string
  campaignId: string
  type: EntityType
  name: string
  description: string | null
  visibility: Visibility
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export interface Relationship {
  id: string
  campaignId: string
  sourceEntityId: string
  targetEntityId: string
  relationshipType: string
  description: string | null
  createdAt: number
  sourceEntity?: Entity | null
  targetEntity?: Entity | null
}

export interface EntityCounts {
  npc: number
  location: number
  faction: number
  item: number
  total: number
}

export const RELATIONSHIP_TYPES = [
  'belongs_to',
  'lives_in',
  'controls',
  'owns',
  'allied_with',
  'enemy_of',
  'member_of',
  'located_in',
  'created_by',
  'related_to',
] as const

export type RelationshipType = typeof RELATIONSHIP_TYPES[number]

export const RELATIONSHIP_LABELS: Record<string, string> = {
  belongs_to: 'Belongs To',
  lives_in: 'Lives In',
  controls: 'Controls',
  owns: 'Owns',
  allied_with: 'Allied With',
  enemy_of: 'Enemy Of',
  member_of: 'Member Of',
  located_in: 'Located In',
  created_by: 'Created By',
  related_to: 'Related To',
}

declare global {
  interface Window {
    api: {
      campaigns: {
        list: () => Promise<Campaign[]>
        get: (id: string) => Promise<Campaign | null>
        create: (data: { name: string; description?: string; system?: string }) => Promise<Campaign>
        update: (id: string, data: { name?: string; description?: string; system?: string }) => Promise<Campaign>
        delete: (id: string) => Promise<{ success: boolean }>
      }
      entities: {
        list: (campaignId: string, filters?: { type?: EntityType; search?: string }) => Promise<Entity[]>
        get: (id: string) => Promise<Entity | null>
        create: (data: {
          campaignId: string
          name: string
          type: EntityType
          description?: string
          visibility?: Visibility
          metadata?: EntityMetadata
        }) => Promise<Entity>
        update: (id: string, data: {
          name?: string
          description?: string
          visibility?: Visibility
          metadata?: EntityMetadata
        }) => Promise<Entity | null>
        delete: (id: string) => Promise<{ success: boolean }>
        counts: (campaignId: string) => Promise<EntityCounts>
      }
      relationships: {
        list: (entityId: string) => Promise<Relationship[]>
        listByCampaign: (campaignId: string) => Promise<Relationship[]>
        create: (data: {
          campaignId: string
          sourceEntityId: string
          targetEntityId: string
          relationshipType: string
          description?: string
        }) => Promise<Relationship>
        delete: (id: string) => Promise<{ success: boolean }>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<{ success: boolean }>
        getAll: () => Promise<Record<string, string>>
      }
    }
  }
}
