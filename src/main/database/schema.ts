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
