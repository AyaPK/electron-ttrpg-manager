import { describe, it, expect } from 'vitest'
import { setupTestEnvironment } from './helpers/setupTestDb'
import { createCampaign } from '../main/campaigns/campaignService'
import {
  createEntity,
  getEntities,
  getEntityById,
  updateEntity,
  deleteEntity,
} from '../main/entities/entityService'

describe('entityService', () => {
  setupTestEnvironment()

  async function makeCampaign(name = 'Test Campaign') {
    return createCampaign({ name })
  }

  describe('createEntity', () => {
    it('creates an entity with required fields', async () => {
      const campaign = await makeCampaign()
      const entity = await createEntity({
        campaignId: campaign.id,
        type: 'npc',
        name: 'Gandalf',
        visibility: 'campaign',
        metadata: { type: 'npc', occupation: 'Wizard' },
      })

      expect(entity.id).toBeTypeOf('string')
      expect(entity.campaignId).toBe(campaign.id)
      expect(entity.type).toBe('npc')
      expect(entity.name).toBe('Gandalf')
      expect(entity.description).toBeNull()
      expect(entity.visibility).toBe('campaign')
      expect(entity.metadata).toMatchObject({ type: 'npc', occupation: 'Wizard' })
      expect(entity.createdAt).toBeTypeOf('number')
      expect(entity.updatedAt).toBeTypeOf('number')
    })

    it('creates entities of each supported type', async () => {
      const campaign = await makeCampaign()

      const npc = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Guard', visibility: 'campaign', metadata: { type: 'npc' } })
      const loc = await createEntity({ campaignId: campaign.id, type: 'location', name: 'Tavern', visibility: 'campaign', metadata: { type: 'location' } })
      const fac = await createEntity({ campaignId: campaign.id, type: 'faction', name: 'Guild', visibility: 'campaign', metadata: { type: 'faction' } })
      const item = await createEntity({ campaignId: campaign.id, type: 'item', name: 'Sword', visibility: 'campaign', metadata: { type: 'item' } })

      expect(npc.type).toBe('npc')
      expect(loc.type).toBe('location')
      expect(fac.type).toBe('faction')
      expect(item.type).toBe('item')
    })

    it('stores description when provided', async () => {
      const campaign = await makeCampaign()
      const entity = await createEntity({
        campaignId: campaign.id,
        type: 'location',
        name: 'Forest',
        description: 'Dark and deep',
        visibility: 'campaign',
        metadata: { type: 'location' },
      })
      expect(entity.description).toBe('Dark and deep')
    })

    it('rejects an empty name', async () => {
      const campaign = await makeCampaign()
      await expect(
        createEntity({ campaignId: campaign.id, type: 'npc', name: '', visibility: 'campaign', metadata: { type: 'npc' } })
      ).rejects.toThrow()
    })

    it('rejects mismatched metadata type discriminant', async () => {
      const campaign = await makeCampaign()
      await expect(
        createEntity({
          campaignId: campaign.id,
          type: 'npc',
          name: 'Ghost',
          visibility: 'campaign',
          metadata: { type: 'location' } as never,
        })
      ).rejects.toThrow()
    })

    it('assigns unique IDs', async () => {
      const campaign = await makeCampaign()
      const a = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'A', visibility: 'campaign', metadata: { type: 'npc' } })
      const b = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'B', visibility: 'campaign', metadata: { type: 'npc' } })
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('getEntities', () => {
    it('returns empty array when no entities exist', async () => {
      const campaign = await makeCampaign()
      expect(await getEntities(campaign.id)).toEqual([])
    })

    it('returns all entities for the campaign', async () => {
      const campaign = await makeCampaign()
      await createEntity({ campaignId: campaign.id, type: 'npc', name: 'A', visibility: 'campaign', metadata: { type: 'npc' } })
      await createEntity({ campaignId: campaign.id, type: 'location', name: 'B', visibility: 'campaign', metadata: { type: 'location' } })
      const list = await getEntities(campaign.id)
      expect(list).toHaveLength(2)
    })

    it('does not return entities from other campaigns', async () => {
      const c1 = await makeCampaign('C1')
      const c2 = await makeCampaign('C2')
      await createEntity({ campaignId: c1.id, type: 'npc', name: 'Mine', visibility: 'campaign', metadata: { type: 'npc' } })
      const list = await getEntities(c2.id)
      expect(list).toHaveLength(0)
    })

    it('filters by type', async () => {
      const campaign = await makeCampaign()
      await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Guard', visibility: 'campaign', metadata: { type: 'npc' } })
      await createEntity({ campaignId: campaign.id, type: 'location', name: 'Inn', visibility: 'campaign', metadata: { type: 'location' } })

      const npcs = await getEntities(campaign.id, { type: 'npc' })
      expect(npcs).toHaveLength(1)
      expect(npcs[0].type).toBe('npc')
    })

    it('filters by search term in name', async () => {
      const campaign = await makeCampaign()
      await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Gandalf', visibility: 'campaign', metadata: { type: 'npc' } })
      await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Sauron', visibility: 'campaign', metadata: { type: 'npc' } })

      const results = await getEntities(campaign.id, { search: 'gandalf' })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Gandalf')
    })

    it('filters by search term in description', async () => {
      const campaign = await makeCampaign()
      await createEntity({ campaignId: campaign.id, type: 'location', name: 'Cave', description: 'Full of treasure', visibility: 'campaign', metadata: { type: 'location' } })
      await createEntity({ campaignId: campaign.id, type: 'location', name: 'Lake', description: 'Quiet waters', visibility: 'campaign', metadata: { type: 'location' } })

      const results = await getEntities(campaign.id, { search: 'treasure' })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Cave')
    })

    it('combines type and search filters', async () => {
      const campaign = await makeCampaign()
      await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Dragon NPC', visibility: 'campaign', metadata: { type: 'npc' } })
      await createEntity({ campaignId: campaign.id, type: 'location', name: 'Dragon Lair', visibility: 'campaign', metadata: { type: 'location' } })

      const results = await getEntities(campaign.id, { type: 'npc', search: 'dragon' })
      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('npc')
    })
  })

  describe('getEntityById', () => {
    it('returns the entity when it exists in the campaign', async () => {
      const campaign = await makeCampaign()
      const created = await createEntity({ campaignId: campaign.id, type: 'item', name: 'Ring', visibility: 'campaign', metadata: { type: 'item' } })
      const found = await getEntityById(created.id, campaign.id)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
    })

    it('returns null for a non-existent ID', async () => {
      const campaign = await makeCampaign()
      expect(await getEntityById('no-such-id', campaign.id)).toBeNull()
    })

    it('returns null when the entity belongs to a different campaign', async () => {
      const c1 = await makeCampaign('C1')
      const c2 = await makeCampaign('C2')
      const entity = await createEntity({ campaignId: c1.id, type: 'npc', name: 'Spy', visibility: 'campaign', metadata: { type: 'npc' } })
      expect(await getEntityById(entity.id, c2.id)).toBeNull()
    })
  })

  describe('updateEntity', () => {
    it('updates the entity name', async () => {
      const campaign = await makeCampaign()
      const created = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Old', visibility: 'campaign', metadata: { type: 'npc' } })
      const updated = await updateEntity(created.id, campaign.id, { name: 'New' })
      expect(updated.name).toBe('New')
    })

    it('updates description', async () => {
      const campaign = await makeCampaign()
      const created = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Hero', visibility: 'campaign', metadata: { type: 'npc' } })
      const updated = await updateEntity(created.id, campaign.id, { description: 'Brave' })
      expect(updated.description).toBe('Brave')
    })

    it('updates visibility', async () => {
      const campaign = await makeCampaign()
      const created = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Secret', visibility: 'private', metadata: { type: 'npc' } })
      const updated = await updateEntity(created.id, campaign.id, { visibility: 'players' })
      expect(updated.visibility).toBe('players')
    })

    it('updates metadata', async () => {
      const campaign = await makeCampaign()
      const created = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Mage', visibility: 'campaign', metadata: { type: 'npc', occupation: 'Apprentice' } })
      const updated = await updateEntity(created.id, campaign.id, { metadata: { type: 'npc', occupation: 'Archmage' } })
      expect((updated.metadata as { occupation: string }).occupation).toBe('Archmage')
    })

    it('advances updatedAt', async () => {
      const campaign = await makeCampaign()
      const created = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Tick', visibility: 'campaign', metadata: { type: 'npc' } })
      await new Promise((r) => setTimeout(r, 5))
      const updated = await updateEntity(created.id, campaign.id, { name: 'Tock' })
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt)
    })

    it('preserves fields not in the patch', async () => {
      const campaign = await makeCampaign()
      const created = await createEntity({ campaignId: campaign.id, type: 'faction', name: 'Guild', visibility: 'campaign', metadata: { type: 'faction', goals: 'profit' } })
      const updated = await updateEntity(created.id, campaign.id, { name: 'Renamed Guild' })
      expect(updated.type).toBe('faction')
      expect(updated.campaignId).toBe(campaign.id)
      expect(updated.createdAt).toBe(created.createdAt)
    })

    it('throws when entity does not exist', async () => {
      const campaign = await makeCampaign()
      await expect(updateEntity('ghost', campaign.id, { name: 'X' })).rejects.toThrow(
        'Entity not found in campaign: ghost'
      )
    })

    it('throws when entity belongs to a different campaign', async () => {
      const c1 = await makeCampaign('C1')
      const c2 = await makeCampaign('C2')
      const entity = await createEntity({ campaignId: c1.id, type: 'npc', name: 'Protected', visibility: 'campaign', metadata: { type: 'npc' } })
      await expect(updateEntity(entity.id, c2.id, { name: 'Hijacked' })).rejects.toThrow(
        `Entity not found in campaign: ${entity.id}`
      )
    })
  })

  describe('deleteEntity', () => {
    it('removes the entity', async () => {
      const campaign = await makeCampaign()
      const entity = await createEntity({ campaignId: campaign.id, type: 'item', name: 'Trash', visibility: 'campaign', metadata: { type: 'item' } })
      await deleteEntity(entity.id, campaign.id)
      expect(await getEntityById(entity.id, campaign.id)).toBeNull()
    })

    it('removes only the targeted entity', async () => {
      const campaign = await makeCampaign()
      const a = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Keep', visibility: 'campaign', metadata: { type: 'npc' } })
      const b = await createEntity({ campaignId: campaign.id, type: 'npc', name: 'Remove', visibility: 'campaign', metadata: { type: 'npc' } })
      await deleteEntity(b.id, campaign.id)
      expect(await getEntityById(a.id, campaign.id)).not.toBeNull()
      expect(await getEntityById(b.id, campaign.id)).toBeNull()
    })

    it('does not delete entity belonging to another campaign', async () => {
      const c1 = await makeCampaign('C1')
      const c2 = await makeCampaign('C2')
      const entity = await createEntity({ campaignId: c1.id, type: 'npc', name: 'Protected', visibility: 'campaign', metadata: { type: 'npc' } })
      await deleteEntity(entity.id, c2.id)
      expect(await getEntityById(entity.id, c1.id)).not.toBeNull()
    })

    it('resolves without error for a non-existent ID', async () => {
      const campaign = await makeCampaign()
      await expect(deleteEntity('phantom', campaign.id)).resolves.toBeUndefined()
    })
  })

  describe('end-to-end entity lifecycle', () => {
    it('create → list → update → delete completes without error', async () => {
      const campaign = await makeCampaign()

      const created = await createEntity({
        campaignId: campaign.id,
        type: 'location',
        name: 'Dungeon',
        description: 'Dark',
        visibility: 'private',
        metadata: { type: 'location', locationType: 'Underground' },
      })

      expect((await getEntities(campaign.id)).map((e) => e.id)).toContain(created.id)

      const updated = await updateEntity(created.id, campaign.id, { name: 'Deep Dungeon', visibility: 'campaign' })
      expect(updated.name).toBe('Deep Dungeon')
      expect(updated.visibility).toBe('campaign')

      await deleteEntity(created.id, campaign.id)
      expect(await getEntityById(created.id, campaign.id)).toBeNull()
      expect(await getEntities(campaign.id)).toHaveLength(0)
    })
  })
})
