import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../database/connection'
import { entities } from '../database/schema'
import type { DbEntity } from '../database/schema'
import {
  EntityTypeSchema,
  CreateEntitySchema,
  UpdateEntitySchema,
} from './entityTypes'
import type { Entity, CreateEntityInput, UpdateEntityInput } from './entityTypes'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deserialise(row: DbEntity): Entity {
  return {
    id: row.id,
    campaignId: row.campaignId,
    type: EntityTypeSchema.parse(row.type),
    name: row.name,
    description: row.description ?? null,
    visibility: row.visibility as Entity['visibility'],
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// Filter schema (used by getEntities)
// ---------------------------------------------------------------------------

export const EntityFilterSchema = z.object({
  type: EntityTypeSchema.optional(),
  search: z.string().optional(),
})

export type EntityFilter = z.infer<typeof EntityFilterSchema>

// ---------------------------------------------------------------------------
// createEntity
// ---------------------------------------------------------------------------

export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  const data = CreateEntitySchema.parse(input)
  const db = getDatabase()
  const now = Date.now()

  const row: DbEntity = {
    id: randomUUID(),
    campaignId: data.campaignId,
    type: data.type,
    name: data.name,
    description: data.description ?? null,
    visibility: data.visibility,
    metadata: JSON.stringify(data.metadata),
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(entities).values(row)
  return deserialise(row)
}

// ---------------------------------------------------------------------------
// getEntities — campaign-scoped, optional type + search filters
// ---------------------------------------------------------------------------

export async function getEntities(
  campaignId: string,
  filter?: EntityFilter,
): Promise<Entity[]> {
  const { type, search } = EntityFilterSchema.parse(filter ?? {})
  const db = getDatabase()

  const conditions = [eq(entities.campaignId, campaignId)]
  if (type) conditions.push(eq(entities.type, type))

  const rows = await db
    .select()
    .from(entities)
    .where(and(...conditions))
    .orderBy(entities.updatedAt)

  const results = rows.map(deserialise)

  if (search) {
    const q = search.toLowerCase()
    return results.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false),
    )
  }

  return results
}

// ---------------------------------------------------------------------------
// getEntityById — always validates campaign ownership
// ---------------------------------------------------------------------------

export async function getEntityById(
  id: string,
  campaignId: string,
): Promise<Entity | null> {
  const db = getDatabase()
  const rows = await db
    .select()
    .from(entities)
    .where(and(eq(entities.id, id), eq(entities.campaignId, campaignId)))
  return rows[0] ? deserialise(rows[0]) : null
}

// ---------------------------------------------------------------------------
// updateEntity — campaign-scoped; throws if not found in that campaign
// ---------------------------------------------------------------------------

export async function updateEntity(
  id: string,
  campaignId: string,
  input: UpdateEntityInput,
): Promise<Entity> {
  const data = UpdateEntitySchema.parse(input)
  const db = getDatabase()

  const existing = await getEntityById(id, campaignId)
  if (!existing) {
    throw new Error(`Entity not found in campaign: ${id}`)
  }

  const patch: Partial<DbEntity> = { updatedAt: Date.now() }
  if (data.name !== undefined) patch.name = data.name
  if (data.description !== undefined) patch.description = data.description
  if (data.visibility !== undefined) patch.visibility = data.visibility
  if (data.metadata !== undefined) patch.metadata = JSON.stringify(data.metadata)

  await db
    .update(entities)
    .set(patch)
    .where(and(eq(entities.id, id), eq(entities.campaignId, campaignId)))

  return {
    ...existing,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.visibility !== undefined && { visibility: data.visibility }),
    ...(data.metadata !== undefined && { metadata: data.metadata as Record<string, unknown> }),
    updatedAt: patch.updatedAt!,
  }
}

// ---------------------------------------------------------------------------
// deleteEntity — campaign-scoped; silently no-ops if already gone
// ---------------------------------------------------------------------------

export async function deleteEntity(id: string, campaignId: string): Promise<void> {
  const db = getDatabase()
  await db
    .delete(entities)
    .where(and(eq(entities.id, id), eq(entities.campaignId, campaignId)))
}
