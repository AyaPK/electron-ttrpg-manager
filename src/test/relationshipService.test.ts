import { describe, it, expect } from 'vitest'
import { setupTestEnvironment } from './helpers/setupTestDb'
import { createCampaign } from '../main/campaigns/campaignService'
import { createEntity } from '../main/entities/entityService'
import {
  createRelationship,
  getRelationshipsByEntity,
  getRelationshipsByCampaign,
  deleteRelationship,
  CreateRelationshipSchema,
} from '../main/relationships/relationshipService'

describe('relationshipService', () => {
  setupTestEnvironment()

  async function makeCampaign(name = 'Test Campaign') {
    return createCampaign({ name })
  }

  async function makeEntity(campaignId: string, name: string, type: 'npc' | 'location' | 'faction' | 'item' = 'npc') {
    return createEntity({
      campaignId,
      type,
      name,
      visibility: 'campaign',
      metadata: { type },
    })
  }

  describe('CreateRelationshipSchema validation', () => {
    it('accepts valid input', () => {
      const result = CreateRelationshipSchema.safeParse({
        campaignId: 'c1',
        sourceEntityId: 'e1',
        targetEntityId: 'e2',
        relationshipType: 'allied_with',
      })
      expect(result.success).toBe(true)
    })

    it('rejects an invalid relationship type', () => {
      const result = CreateRelationshipSchema.safeParse({
        campaignId: 'c1',
        sourceEntityId: 'e1',
        targetEntityId: 'e2',
        relationshipType: 'invented_type',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty campaignId', () => {
      const result = CreateRelationshipSchema.safeParse({
        campaignId: '',
        sourceEntityId: 'e1',
        targetEntityId: 'e2',
        relationshipType: 'related_to',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createRelationship', () => {
    it('creates a relationship between two entities', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'Guard')
      const b = await makeEntity(campaign.id, 'Captain')

      const rel = await createRelationship({
        campaignId: campaign.id,
        sourceEntityId: a.id,
        targetEntityId: b.id,
        relationshipType: 'member_of',
      })

      expect(rel.id).toBeTypeOf('string')
      expect(rel.campaignId).toBe(campaign.id)
      expect(rel.sourceEntityId).toBe(a.id)
      expect(rel.targetEntityId).toBe(b.id)
      expect(rel.relationshipType).toBe('member_of')
      expect(rel.description).toBeNull()
      expect(rel.createdAt).toBeTypeOf('number')
    })

    it('stores an optional description', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'Hero')
      const b = await makeEntity(campaign.id, 'Villain')

      const rel = await createRelationship({
        campaignId: campaign.id,
        sourceEntityId: a.id,
        targetEntityId: b.id,
        relationshipType: 'enemy_of',
        description: 'Since the Battle of Five Armies',
      })

      expect(rel.description).toBe('Since the Battle of Five Armies')
    })

    it('assigns unique IDs', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'A')
      const b = await makeEntity(campaign.id, 'B')
      const c = await makeEntity(campaign.id, 'C')

      const r1 = await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'related_to' })
      const r2 = await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: c.id, relationshipType: 'related_to' })

      expect(r1.id).not.toBe(r2.id)
    })

    it('throws when linking an entity to itself', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'Self')

      await expect(
        createRelationship({
          campaignId: campaign.id,
          sourceEntityId: a.id,
          targetEntityId: a.id,
          relationshipType: 'related_to',
        })
      ).rejects.toThrow('A relationship cannot link an entity to itself')
    })

    it('rejects an invalid relationship type via Zod', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'A')
      const b = await makeEntity(campaign.id, 'B')

      await expect(
        createRelationship({
          campaignId: campaign.id,
          sourceEntityId: a.id,
          targetEntityId: b.id,
          relationshipType: 'made_up' as never,
        })
      ).rejects.toThrow()
    })
  })

  describe('getRelationshipsByEntity', () => {
    it('returns empty array when no relationships exist', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'Lone')
      expect(await getRelationshipsByEntity(a.id)).toEqual([])
    })

    it('returns relationships where entity is source', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'A')
      const b = await makeEntity(campaign.id, 'B')
      await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'controls' })

      const rels = await getRelationshipsByEntity(a.id)
      expect(rels).toHaveLength(1)
      expect(rels[0].sourceEntityId).toBe(a.id)
    })

    it('returns relationships where entity is target', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'A')
      const b = await makeEntity(campaign.id, 'B')
      await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'controls' })

      const rels = await getRelationshipsByEntity(b.id)
      expect(rels).toHaveLength(1)
      expect(rels[0].targetEntityId).toBe(b.id)
    })

    it('enriches results with sourceEntity and targetEntity', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'Mage')
      const b = await makeEntity(campaign.id, 'Tower', 'location')
      await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'lives_in' })

      const rels = await getRelationshipsByEntity(a.id)
      expect(rels[0].sourceEntity).not.toBeNull()
      expect(rels[0].sourceEntity!.name).toBe('Mage')
      expect(rels[0].targetEntity).not.toBeNull()
      expect(rels[0].targetEntity!.name).toBe('Tower')
    })

    it('returns all relationships an entity participates in', async () => {
      const campaign = await makeCampaign()
      const hub = await makeEntity(campaign.id, 'Hub')
      const x = await makeEntity(campaign.id, 'X')
      const y = await makeEntity(campaign.id, 'Y')

      await createRelationship({ campaignId: campaign.id, sourceEntityId: hub.id, targetEntityId: x.id, relationshipType: 'related_to' })
      await createRelationship({ campaignId: campaign.id, sourceEntityId: y.id, targetEntityId: hub.id, relationshipType: 'allied_with' })

      const rels = await getRelationshipsByEntity(hub.id)
      expect(rels).toHaveLength(2)
    })
  })

  describe('getRelationshipsByCampaign', () => {
    it('returns empty array when no relationships exist', async () => {
      const campaign = await makeCampaign()
      expect(await getRelationshipsByCampaign(campaign.id)).toEqual([])
    })

    it('returns all relationships for a campaign', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'A')
      const b = await makeEntity(campaign.id, 'B')
      const c = await makeEntity(campaign.id, 'C')

      await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'related_to' })
      await createRelationship({ campaignId: campaign.id, sourceEntityId: b.id, targetEntityId: c.id, relationshipType: 'controls' })

      const rels = await getRelationshipsByCampaign(campaign.id)
      expect(rels).toHaveLength(2)
    })

    it('does not return relationships from other campaigns', async () => {
      const c1 = await makeCampaign('C1')
      const c2 = await makeCampaign('C2')
      const a = await makeEntity(c1.id, 'A')
      const b = await makeEntity(c1.id, 'B')
      await createRelationship({ campaignId: c1.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'related_to' })

      expect(await getRelationshipsByCampaign(c2.id)).toHaveLength(0)
    })
  })

  describe('deleteRelationship', () => {
    it('removes the relationship', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'A')
      const b = await makeEntity(campaign.id, 'B')
      const rel = await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'related_to' })

      await deleteRelationship(rel.id, campaign.id)

      const remaining = await getRelationshipsByCampaign(campaign.id)
      expect(remaining.map((r) => r.id)).not.toContain(rel.id)
    })

    it('only removes the targeted relationship', async () => {
      const campaign = await makeCampaign()
      const a = await makeEntity(campaign.id, 'A')
      const b = await makeEntity(campaign.id, 'B')
      const c = await makeEntity(campaign.id, 'C')

      const r1 = await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'related_to' })
      const r2 = await createRelationship({ campaignId: campaign.id, sourceEntityId: a.id, targetEntityId: c.id, relationshipType: 'controls' })

      await deleteRelationship(r1.id, campaign.id)

      const remaining = await getRelationshipsByCampaign(campaign.id)
      expect(remaining.map((r) => r.id)).not.toContain(r1.id)
      expect(remaining.map((r) => r.id)).toContain(r2.id)
    })

    it('does not delete a relationship belonging to another campaign', async () => {
      const c1 = await makeCampaign('C1')
      const c2 = await makeCampaign('C2')
      const a = await makeEntity(c1.id, 'A')
      const b = await makeEntity(c1.id, 'B')
      const rel = await createRelationship({ campaignId: c1.id, sourceEntityId: a.id, targetEntityId: b.id, relationshipType: 'related_to' })

      await deleteRelationship(rel.id, c2.id)

      const remaining = await getRelationshipsByCampaign(c1.id)
      expect(remaining.map((r) => r.id)).toContain(rel.id)
    })

    it('resolves without error for a non-existent ID', async () => {
      const campaign = await makeCampaign()
      await expect(deleteRelationship('ghost', campaign.id)).resolves.toBeUndefined()
    })
  })

  describe('end-to-end relationship lifecycle', () => {
    it('create → list → delete completes without error', async () => {
      const campaign = await makeCampaign()
      const npc = await makeEntity(campaign.id, 'Gandalf')
      const faction = await makeEntity(campaign.id, 'Fellowship', 'faction')

      const rel = await createRelationship({
        campaignId: campaign.id,
        sourceEntityId: npc.id,
        targetEntityId: faction.id,
        relationshipType: 'member_of',
        description: 'A founding member',
      })

      const byEntity = await getRelationshipsByEntity(npc.id)
      expect(byEntity.map((r) => r.id)).toContain(rel.id)
      expect(byEntity[0].targetEntity!.name).toBe('Fellowship')

      const byCampaign = await getRelationshipsByCampaign(campaign.id)
      expect(byCampaign.map((r) => r.id)).toContain(rel.id)

      await deleteRelationship(rel.id, campaign.id)
      expect(await getRelationshipsByCampaign(campaign.id)).toHaveLength(0)
    })
  })
})
