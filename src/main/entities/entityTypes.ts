import { z } from 'zod'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const EntityTypeSchema = z.enum(['npc', 'location', 'faction', 'item', 'monster', 'player', 'spell'])
export type EntityType = z.infer<typeof EntityTypeSchema>

export const VisibilitySchema = z.enum(['private', 'campaign', 'players'])
export type Visibility = z.infer<typeof VisibilitySchema>

// ---------------------------------------------------------------------------
// Per-type metadata schemas
// ---------------------------------------------------------------------------

export const NpcMetadataSchema = z.object({
  type: z.literal('npc'),
  occupation: z.string().optional(),
  personality: z.string().optional(),
  race: z.string().optional(),
  affiliation: z.string().optional(),
})

export const LocationMetadataSchema = z.object({
  type: z.literal('location'),
  locationType: z.string().optional(),
  region: z.string().optional(),
  population: z.string().optional(),
})

export const FactionMetadataSchema = z.object({
  type: z.literal('faction'),
  goals: z.string().optional(),
  alignment: z.string().optional(),
  headquarters: z.string().optional(),
})

export const ItemMetadataSchema = z.object({
  type: z.literal('item'),
  itemType: z.string().optional(),
  rarity: z.string().optional(),
  attunement: z.boolean().optional(),
})

const MonsterActionSchema = z.object({
  name: z.string(),
  desc: z.string(),
  attack_bonus: z.number().optional(),
  damage_dice: z.string().optional(),
  damage_bonus: z.number().optional(),
})

export const MonsterMetadataSchema = z.object({
  type: z.literal('monster'),
  monsterType: z.string().optional(),
  challengeRating: z.string().optional(),
  habitat: z.string().optional(),
  // Full stat block fields
  size: z.string().optional(),
  subtype: z.string().optional(),
  alignment: z.string().optional(),
  armorClass: z.number().optional(),
  hitPoints: z.number().optional(),
  hitDice: z.string().optional(),
  speed: z.string().optional(),
  strength: z.number().optional(),
  dexterity: z.number().optional(),
  constitution: z.number().optional(),
  intelligence: z.number().optional(),
  wisdom: z.number().optional(),
  charisma: z.number().optional(),
  senses: z.string().optional(),
  languages: z.string().optional(),
  damageVulnerabilities: z.string().optional(),
  damageResistances: z.string().optional(),
  damageImmunities: z.string().optional(),
  conditionImmunities: z.string().optional(),
  specialAbilities: z.array(MonsterActionSchema).optional(),
  actions: z.array(MonsterActionSchema).optional(),
  legendaryActions: z.array(MonsterActionSchema).optional(),
  reactions: z.array(MonsterActionSchema).optional(),
})

export const SpellMetadataSchema = z.object({
  type: z.literal('spell'),
  level: z.string().optional(),
  school: z.string().optional(),
  castingTime: z.string().optional(),
  range: z.string().optional(),
  components: z.string().optional(),
  duration: z.string().optional(),
  concentration: z.string().optional(),
  ritual: z.string().optional(),
  spellClass: z.string().optional(),
  higherLevel: z.string().optional(),
  page: z.string().optional(),
})

export const PlayerMetadataSchema = z.object({
  type: z.literal('player'),
  playerClass: z.string().optional(),
  race: z.string().optional(),
  level: z.string().optional(),
  player: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export const EntityMetadataSchema = z.discriminatedUnion('type', [
  NpcMetadataSchema,
  LocationMetadataSchema,
  FactionMetadataSchema,
  ItemMetadataSchema,
  MonsterMetadataSchema,
  PlayerMetadataSchema,
  SpellMetadataSchema,
])

export type NpcMetadata = z.infer<typeof NpcMetadataSchema>
export type LocationMetadata = z.infer<typeof LocationMetadataSchema>
export type FactionMetadata = z.infer<typeof FactionMetadataSchema>
export type ItemMetadata = z.infer<typeof ItemMetadataSchema>
export type MonsterMetadata = z.infer<typeof MonsterMetadataSchema>
export type PlayerMetadata = z.infer<typeof PlayerMetadataSchema>
export type SpellMetadata = z.infer<typeof SpellMetadataSchema>
export type EntityMetadata = z.infer<typeof EntityMetadataSchema>

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CRUD input schemas
// ---------------------------------------------------------------------------

export const CreateEntitySchema = z
  .object({
    campaignId: z.string().min(1),
    type: EntityTypeSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    visibility: VisibilitySchema.default('campaign'),
    metadata: EntityMetadataSchema,
  })
  .refine((v) => v.metadata.type === v.type, {
    message: 'metadata.type must match entity type',
    path: ['metadata', 'type'],
  })

export const UpdateEntitySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: VisibilitySchema.optional(),
  metadata: EntityMetadataSchema.optional(),
})

export type CreateEntityInput = z.infer<typeof CreateEntitySchema>
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>
