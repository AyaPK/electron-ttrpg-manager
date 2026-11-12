import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  name: text('name').notNull(),
  description: text('description'),
  system: text('system'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert

export const entities = sqliteTable(
  'entities',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    type: text('type').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    visibility: text('visibility').notNull().default('campaign'),
    metadata: text('metadata').notNull().default('{}'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('entities_campaign_id_idx').on(t.campaignId),
    index('entities_type_idx').on(t.type),
  ],
)

export type DbEntity = typeof entities.$inferSelect
export type NewDbEntity = typeof entities.$inferInsert

export const relationships = sqliteTable(
  'relationships',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    sourceEntityId: text('source_entity_id')
      .notNull()
      .references(() => entities.id),
    targetEntityId: text('target_entity_id')
      .notNull()
      .references(() => entities.id),
    relationshipType: text('relationship_type').notNull(),
    description: text('description'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('relationships_campaign_id_idx').on(t.campaignId),
    index('relationships_source_entity_id_idx').on(t.sourceEntityId),
    index('relationships_target_entity_id_idx').on(t.targetEntityId),
  ],
)

export type DbRelationship = typeof relationships.$inferSelect
export type NewDbRelationship = typeof relationships.$inferInsert

export const encounters = sqliteTable(
  'encounters',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('draft'),
    notes: text('notes'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('encounters_campaign_id_idx').on(t.campaignId),
  ],
)

export type DbEncounter = typeof encounters.$inferSelect
export type NewDbEncounter = typeof encounters.$inferInsert

export const encounterGroups = sqliteTable(
  'encounter_groups',
  {
    id: text('id').primaryKey(),
    encounterId: text('encounter_id')
      .notNull()
      .references(() => encounters.id),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    index('encounter_groups_encounter_id_idx').on(t.encounterId),
  ],
)

export type DbEncounterGroup = typeof encounterGroups.$inferSelect
export type NewDbEncounterGroup = typeof encounterGroups.$inferInsert

export const encounterEntries = sqliteTable(
  'encounter_entries',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => encounterGroups.id),
    encounterId: text('encounter_id')
      .notNull()
      .references(() => encounters.id),
    name: text('name').notNull(),
    cr: text('cr').notNull().default('1'),
    count: integer('count').notNull().default(1),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    index('encounter_entries_group_id_idx').on(t.groupId),
    index('encounter_entries_encounter_id_idx').on(t.encounterId),
  ],
)

export type DbEncounterEntry = typeof encounterEntries.$inferSelect
export type NewDbEncounterEntry = typeof encounterEntries.$inferInsert
