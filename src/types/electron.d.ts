export interface Campaign {
  id: string
  workspaceId: string
  name: string
  description: string | null
  system: string | null
  backgroundImage: string | null
  createdAt: number
  updatedAt: number
}

export type EntityType = 'npc' | 'location' | 'faction' | 'item' | 'monster' | 'player' | 'spell'
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

export interface MonsterAction {
  name: string
  desc: string
  attack_bonus?: number
  damage_dice?: string
  damage_bonus?: number
}

export interface MonsterMetadata {
  type: 'monster'
  monsterType?: string
  challengeRating?: string
  habitat?: string
  size?: string
  subtype?: string
  alignment?: string
  armorClass?: number
  hitPoints?: number
  hitDice?: string
  speed?: string
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  senses?: string
  languages?: string
  damageVulnerabilities?: string
  damageResistances?: string
  damageImmunities?: string
  conditionImmunities?: string
  specialAbilities?: MonsterAction[]
  actions?: MonsterAction[]
  legendaryActions?: MonsterAction[]
  reactions?: MonsterAction[]
}

export interface PlayerMetadata {
  type: 'player'
  playerClass?: string
  race?: string
  level?: string
  player?: string
}

export interface SpellMetadata {
  type: 'spell'
  level?: string
  school?: string
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  concentration?: string
  ritual?: string
  spellClass?: string
  higherLevel?: string
  page?: string
}

export type EntityMetadata = NpcMetadata | LocationMetadata | FactionMetadata | ItemMetadata | MonsterMetadata | PlayerMetadata

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
  monster: number
  player: number
  spell: number
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

export type EncounterStatus = 'draft' | 'ready' | 'complete'

export interface EncounterEntry {
  id: string
  groupId: string
  encounterId: string
  name: string
  cr: string
  count: number
  notes: string | null
  sortOrder: number
}

export interface EncounterGroup {
  id: string
  encounterId: string
  name: string
  sortOrder: number
  entries: EncounterEntry[]
}

export interface Encounter {
  id: string
  campaignId: string
  name: string
  description: string | null
  status: EncounterStatus
  notes: string | null
  createdAt: number
  updatedAt: number
  groups: EncounterGroup[]
}

declare global {
  interface Window {
    api: {
      campaigns: {
        list: () => Promise<Campaign[]>
        get: (id: string) => Promise<Campaign | null>
        create: (data: { name: string; description?: string; system?: string }) => Promise<Campaign>
        update: (id: string, data: { name?: string; description?: string; system?: string; backgroundImage?: string | null }) => Promise<Campaign>
        pickImage: () => Promise<string | null>
        delete: (id: string) => Promise<{ success: boolean }>
        seedMonsters: (campaignId: string) => Promise<{ seeded: number }>
        seedSpells: (campaignId: string) => Promise<{ seeded: number }>
      }
      entities: {
        list: (campaignId: string, filters?: { type?: EntityType; search?: string }) => Promise<Entity[]>
        get: (id: string, campaignId: string) => Promise<Entity | null>
        create: (data: {
          campaignId: string
          type: EntityType
          name: string
          description?: string
          visibility?: Visibility
          metadata: Record<string, unknown>
        }) => Promise<Entity>
        update: (id: string, campaignId: string, data: {
          name?: string
          description?: string
          visibility?: Visibility
          metadata?: Record<string, unknown>
        }) => Promise<Entity>
        delete: (id: string, campaignId: string) => Promise<{ success: boolean }>
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
        delete: (id: string, campaignId: string) => Promise<{ success: boolean }>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<{ success: boolean }>
        getAll: () => Promise<Record<string, string>>
      }
      encounters: {
        list: (campaignId: string) => Promise<Encounter[]>
        get: (id: string, campaignId: string) => Promise<Encounter | null>
        create: (data: { campaignId: string; name: string; description?: string; notes?: string }) => Promise<Encounter>
        update: (id: string, campaignId: string, data: { name?: string; description?: string; notes?: string; status?: EncounterStatus }) => Promise<Encounter>
        delete: (id: string, campaignId: string) => Promise<{ success: boolean }>
        createGroup: (data: { encounterId: string; name: string; sortOrder?: number }) => Promise<EncounterGroup>
        updateGroup: (id: string, data: { name?: string; sortOrder?: number }) => Promise<EncounterGroup>
        deleteGroup: (id: string) => Promise<{ success: boolean }>
        createEntry: (data: { groupId: string; encounterId: string; name: string; cr?: string; count?: number; notes?: string; sortOrder?: number }) => Promise<EncounterEntry>
        updateEntry: (id: string, data: { name?: string; cr?: string; count?: number; notes?: string }) => Promise<EncounterEntry>
        deleteEntry: (id: string) => Promise<{ success: boolean }>
      }
    }
  }
}
