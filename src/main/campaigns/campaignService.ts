import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../database/connection'
import { campaigns } from '../database/schema'
import { getActiveWorkspace } from '../workspaces/workspaceService'
import { seedMonstersForCampaign } from '../entities/monsterSeedService'
import { seedSpellsForCampaign } from '../entities/spellSeedService'
import type { Campaign } from '../database/schema'

export const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  system: z.string().optional(),
})

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  system: z.string().optional(),
  backgroundImage: z.string().nullable().optional(),
})

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const data = CreateCampaignSchema.parse(input)
  const db = getDatabase()
  const workspace = getActiveWorkspace()
  const now = Date.now()

  const campaign: Campaign = {
    id: randomUUID(),
    workspaceId: workspace.id,
    name: data.name,
    description: data.description ?? null,
    system: data.system ?? null,
    backgroundImage: null,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(campaigns).values(campaign)

  // Seed monster entities from JSON file (skips if file not found or already seeded)
  seedMonstersForCampaign(campaign.id).catch((err) =>
    console.error('[campaignService] Monster seed failed:', err),
  )

  // Seed spell entities from JSON file (skips if file not found or already seeded)
  seedSpellsForCampaign(campaign.id).catch((err) =>
    console.error('[campaignService] Spell seed failed:', err),
  )

  return campaign
}

export async function getCampaigns(): Promise<Campaign[]> {
  const db = getDatabase()
  const workspace = getActiveWorkspace()
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.workspaceId, workspace.id))
    .orderBy(campaigns.updatedAt)
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const db = getDatabase()
  const rows = await db.select().from(campaigns).where(eq(campaigns.id, id))
  return rows[0] ?? null
}

export async function updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
  const data = UpdateCampaignSchema.parse(input)
  const db = getDatabase()

  const existing = await getCampaignById(id)
  if (!existing) {
    throw new Error(`Campaign not found: ${id}`)
  }

  const updated: Partial<Campaign> = { updatedAt: Date.now() }
  if (data.name !== undefined) updated.name = data.name
  if (data.description !== undefined) updated.description = data.description
  if (data.system !== undefined) updated.system = data.system
  if (data.backgroundImage !== undefined) updated.backgroundImage = data.backgroundImage

  await db.update(campaigns).set(updated).where(eq(campaigns.id, id))

  return { ...existing, ...updated }
}

export async function deleteCampaign(id: string): Promise<void> {
  const db = getDatabase()
  await db.delete(campaigns).where(eq(campaigns.id, id))
}
