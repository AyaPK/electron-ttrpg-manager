import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../database/connection'
import { encounters, encounterGroups, encounterEntries } from '../database/schema'
import type { DbEncounter, DbEncounterGroup, DbEncounterEntry } from '../database/schema'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const CreateEncounterSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateEncounterSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'ready', 'complete']).optional(),
})

export const CreateGroupSchema = z.object({
  encounterId: z.string().min(1),
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
})

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
})

export const CreateEntrySchema = z.object({
  groupId: z.string().min(1),
  encounterId: z.string().min(1),
  name: z.string().min(1),
  cr: z.string().default('1'),
  count: z.number().int().min(1).default(1),
  notes: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

export const UpdateEntrySchema = z.object({
  name: z.string().min(1).optional(),
  cr: z.string().optional(),
  count: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface EncounterEntry extends DbEncounterEntry {}

export interface EncounterGroup extends DbEncounterGroup {
  entries: EncounterEntry[]
}

export interface EncounterWithGroups extends DbEncounter {
  groups: EncounterGroup[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadGroupsForEncounter(encounterId: string): Promise<EncounterGroup[]> {
  const db = getDatabase()
  const groups = await db
    .select()
    .from(encounterGroups)
    .where(eq(encounterGroups.encounterId, encounterId))
    .orderBy(encounterGroups.sortOrder)

  return Promise.all(
    groups.map(async (g) => {
      const entries = await db
        .select()
        .from(encounterEntries)
        .where(eq(encounterEntries.groupId, g.id))
        .orderBy(encounterEntries.sortOrder)
      return { ...g, entries }
    }),
  )
}

// ---------------------------------------------------------------------------
// Encounters CRUD
// ---------------------------------------------------------------------------

export async function createEncounter(
  input: z.infer<typeof CreateEncounterSchema>,
): Promise<EncounterWithGroups> {
  const data = CreateEncounterSchema.parse(input)
  const db = getDatabase()
  const now = Date.now()

  const row: DbEncounter = {
    id: randomUUID(),
    campaignId: data.campaignId,
    name: data.name,
    description: data.description ?? null,
    status: 'draft',
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(encounters).values(row)
  return { ...row, groups: [] }
}

export async function getEncountersByCampaign(
  campaignId: string,
): Promise<EncounterWithGroups[]> {
  const db = getDatabase()
  const rows = await db
    .select()
    .from(encounters)
    .where(eq(encounters.campaignId, campaignId))
    .orderBy(encounters.createdAt)

  return Promise.all(
    rows.map(async (e) => ({ ...e, groups: await loadGroupsForEncounter(e.id) })),
  )
}

export async function getEncounter(
  id: string,
  campaignId: string,
): Promise<EncounterWithGroups | null> {
  const db = getDatabase()
  const [row] = await db
    .select()
    .from(encounters)
    .where(and(eq(encounters.id, id), eq(encounters.campaignId, campaignId)))

  if (!row) return null
  return { ...row, groups: await loadGroupsForEncounter(row.id) }
}

export async function updateEncounter(
  id: string,
  campaignId: string,
  input: z.infer<typeof UpdateEncounterSchema>,
): Promise<EncounterWithGroups> {
  const data = UpdateEncounterSchema.parse(input)
  const db = getDatabase()

  await db
    .update(encounters)
    .set({ ...data, updatedAt: Date.now() })
    .where(and(eq(encounters.id, id), eq(encounters.campaignId, campaignId)))

  const result = await getEncounter(id, campaignId)
  if (!result) throw new Error('Encounter not found')
  return result
}

export async function deleteEncounter(id: string, campaignId: string): Promise<void> {
  const db = getDatabase()
  const groups = await db
    .select()
    .from(encounterGroups)
    .where(eq(encounterGroups.encounterId, id))

  for (const g of groups) {
    await db.delete(encounterEntries).where(eq(encounterEntries.groupId, g.id))
  }
  await db.delete(encounterGroups).where(eq(encounterGroups.encounterId, id))
  await db
    .delete(encounters)
    .where(and(eq(encounters.id, id), eq(encounters.campaignId, campaignId)))
}

// ---------------------------------------------------------------------------
// Groups CRUD
// ---------------------------------------------------------------------------

export async function createGroup(
  input: z.infer<typeof CreateGroupSchema>,
): Promise<EncounterGroup> {
  const data = CreateGroupSchema.parse(input)
  const db = getDatabase()

  const row: DbEncounterGroup = {
    id: randomUUID(),
    encounterId: data.encounterId,
    name: data.name,
    sortOrder: data.sortOrder,
  }

  await db.insert(encounterGroups).values(row)
  return { ...row, entries: [] }
}

export async function updateGroup(
  id: string,
  input: z.infer<typeof UpdateGroupSchema>,
): Promise<EncounterGroup> {
  const data = UpdateGroupSchema.parse(input)
  const db = getDatabase()

  await db.update(encounterGroups).set(data).where(eq(encounterGroups.id, id))

  const [row] = await db.select().from(encounterGroups).where(eq(encounterGroups.id, id))
  if (!row) throw new Error('Group not found')
  const entries = await db
    .select()
    .from(encounterEntries)
    .where(eq(encounterEntries.groupId, id))
    .orderBy(encounterEntries.sortOrder)
  return { ...row, entries }
}

export async function deleteGroup(id: string): Promise<void> {
  const db = getDatabase()
  await db.delete(encounterEntries).where(eq(encounterEntries.groupId, id))
  await db.delete(encounterGroups).where(eq(encounterGroups.id, id))
}

// ---------------------------------------------------------------------------
// Entries CRUD
// ---------------------------------------------------------------------------

export async function createEntry(
  input: z.infer<typeof CreateEntrySchema>,
): Promise<EncounterEntry> {
  const data = CreateEntrySchema.parse(input)
  const db = getDatabase()

  const row: DbEncounterEntry = {
    id: randomUUID(),
    groupId: data.groupId,
    encounterId: data.encounterId,
    name: data.name,
    cr: data.cr,
    count: data.count,
    notes: data.notes ?? null,
    sortOrder: data.sortOrder,
  }

  await db.insert(encounterEntries).values(row)
  return row
}

export async function updateEntry(
  id: string,
  input: z.infer<typeof UpdateEntrySchema>,
): Promise<EncounterEntry> {
  const data = UpdateEntrySchema.parse(input)
  const db = getDatabase()

  await db.update(encounterEntries).set(data).where(eq(encounterEntries.id, id))

  const [row] = await db.select().from(encounterEntries).where(eq(encounterEntries.id, id))
  if (!row) throw new Error('Entry not found')
  return row
}

export async function deleteEntry(id: string): Promise<void> {
  const db = getDatabase()
  await db.delete(encounterEntries).where(eq(encounterEntries.id, id))
}
