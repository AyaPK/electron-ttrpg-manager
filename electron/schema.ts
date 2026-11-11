import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  system: text('system').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['npc', 'location', 'faction', 'item'] }).notNull(),
  visibility: text('visibility', { enum: ['public', 'private'] }).notNull().default('public'),
  description: text('description').notNull().default(''),
  metadata: text('metadata').notNull().default('{}'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const relationships = sqliteTable('relationships', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  sourceEntityId: text('source_entity_id').notNull().references(() => entities.id, { onDelete: 'cascade' }),
  targetEntityId: text('target_entity_id').notNull().references(() => entities.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull(),
  description: text('description').notNull().default(''),
  createdAt: text('created_at').notNull(),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
export type Entity = typeof entities.$inferSelect
export type NewEntity = typeof entities.$inferInsert
export type Relationship = typeof relationships.$inferSelect
export type NewRelationship = typeof relationships.$inferInsert
export type Setting = typeof settings.$inferSelect

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

export const ENTITY_TYPES = ['npc', 'location', 'faction', 'item'] as const
export type EntityType = typeof ENTITY_TYPES[number]
