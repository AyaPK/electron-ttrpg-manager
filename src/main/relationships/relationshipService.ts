import { randomUUID } from 'crypto'
import { and, eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../database/connection'
import { relationships, entities } from '../database/schema'
import type { DbRelationship, DbEntity } from '../database/schema'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

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

export const CreateRelationshipSchema = z.object({
  campaignId: z.string().min(1),
  sourceEntityId: z.string().min(1),
  targetEntityId: z.string().min(1),
  relationshipType: z.enum(RELATIONSHIP_TYPES),
  description: z.string().optional(),
})

export type CreateRelationshipInput = z.infer<typeof CreateRelationshipSchema>

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

function deserialiseEntity(row: DbEntity) {
  return {
    id: row.id,
    campaignId: row.campaignId,
    type: row.type,
    name: row.name,
    description: row.description ?? null,
    visibility: row.visibility,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export interface RelationshipWithEntities extends DbRelationship {
  sourceEntity: ReturnType<typeof deserialiseEntity> | null
  targetEntity: ReturnType<typeof deserialiseEntity> | null
}

// ---------------------------------------------------------------------------
// createRelationship
// ---------------------------------------------------------------------------

export async function createRelationship(
  input: CreateRelationshipInput,
): Promise<DbRelationship> {
  const data = CreateRelationshipSchema.parse(input)
  const db = getDatabase()

  if (data.sourceEntityId === data.targetEntityId) {
    throw new Error('A relationship cannot link an entity to itself')
  }

  const row: DbRelationship = {
    id: randomUUID(),
    campaignId: data.campaignId,
    sourceEntityId: data.sourceEntityId,
    targetEntityId: data.targetEntityId,
    relationshipType: data.relationshipType,
    description: data.description ?? null,
    createdAt: Date.now(),
  }

  await db.insert(relationships).values(row)
  return row
}

// ---------------------------------------------------------------------------
// getRelationshipsByEntity — enriched with both endpoint entities
// ---------------------------------------------------------------------------

export async function getRelationshipsByEntity(
  entityId: string,
): Promise<RelationshipWithEntities[]> {
  const db = getDatabase()

  const rows = await db
    .select()
    .from(relationships)
    .where(
      or(
        eq(relationships.sourceEntityId, entityId),
        eq(relationships.targetEntityId, entityId),
      ),
    )
    .orderBy(relationships.createdAt)

  return Promise.all(
    rows.map(async (rel) => {
      const [src] = await db
        .select()
        .from(entities)
        .where(eq(entities.id, rel.sourceEntityId))
      const [tgt] = await db
        .select()
        .from(entities)
        .where(eq(entities.id, rel.targetEntityId))
      return {
        ...rel,
        sourceEntity: src ? deserialiseEntity(src) : null,
        targetEntity: tgt ? deserialiseEntity(tgt) : null,
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// getRelationshipsByCampaign — flat list, no enrichment needed
// ---------------------------------------------------------------------------

export async function getRelationshipsByCampaign(
  campaignId: string,
): Promise<DbRelationship[]> {
  const db = getDatabase()
  return db
    .select()
    .from(relationships)
    .where(eq(relationships.campaignId, campaignId))
    .orderBy(relationships.createdAt)
}

// ---------------------------------------------------------------------------
// deleteRelationship — campaign-scoped to prevent cross-campaign deletion
// ---------------------------------------------------------------------------

export async function deleteRelationship(
  id: string,
  campaignId: string,
): Promise<void> {
  const db = getDatabase()
  await db
    .delete(relationships)
    .where(and(eq(relationships.id, id), eq(relationships.campaignId, campaignId)))
}
