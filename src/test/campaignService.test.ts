import { describe, it, expect } from 'vitest'
import { setupTestEnvironment, TEST_WORKSPACE } from './helpers/setupTestDb'
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  CreateCampaignSchema,
  UpdateCampaignSchema,
} from '../main/campaigns/campaignService'

describe('campaignService', () => {
  setupTestEnvironment()

  describe('createCampaign', () => {
    it('creates a campaign with required fields', async () => {
      const campaign = await createCampaign({ name: 'Test Campaign' })

      expect(campaign.id).toBeTypeOf('string')
      expect(campaign.name).toBe('Test Campaign')
      expect(campaign.workspaceId).toBe(TEST_WORKSPACE.id)
      expect(campaign.description).toBeNull()
      expect(campaign.system).toBeNull()
      expect(campaign.createdAt).toBeTypeOf('number')
      expect(campaign.updatedAt).toBeTypeOf('number')
    })

    it('creates a campaign with all optional fields', async () => {
      const campaign = await createCampaign({
        name: 'Full Campaign',
        description: 'A detailed description',
        system: 'D&D 5e',
      })

      expect(campaign.name).toBe('Full Campaign')
      expect(campaign.description).toBe('A detailed description')
      expect(campaign.system).toBe('D&D 5e')
    })

    it('assigns unique IDs to each campaign', async () => {
      const a = await createCampaign({ name: 'Campaign A' })
      const b = await createCampaign({ name: 'Campaign B' })
      expect(a.id).not.toBe(b.id)
    })

    it('scopes campaigns to the active workspace', async () => {
      const campaign = await createCampaign({ name: 'Scoped Campaign' })
      expect(campaign.workspaceId).toBe(TEST_WORKSPACE.id)
    })
  })

  describe('CreateCampaignSchema validation', () => {
    it('rejects empty name', () => {
      const result = CreateCampaignSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('accepts name with optional fields omitted', () => {
      const result = CreateCampaignSchema.safeParse({ name: 'Valid' })
      expect(result.success).toBe(true)
    })
  })

  describe('getCampaigns', () => {
    it('returns empty array when no campaigns exist', async () => {
      const list = await getCampaigns()
      expect(list).toEqual([])
    })

    it('returns all created campaigns', async () => {
      await createCampaign({ name: 'Alpha' })
      await createCampaign({ name: 'Beta' })
      const list = await getCampaigns()
      expect(list).toHaveLength(2)
    })

    it('only returns campaigns for the active workspace', async () => {
      await createCampaign({ name: 'Mine' })
      const list = await getCampaigns()
      list.forEach((c) => expect(c.workspaceId).toBe(TEST_WORKSPACE.id))
    })

    it('orders campaigns by updatedAt ascending', async () => {
      const a = await createCampaign({ name: 'First' })
      await new Promise((r) => setTimeout(r, 5))
      const b = await createCampaign({ name: 'Second' })
      const list = await getCampaigns()
      const ids = list.map((c) => c.id)
      expect(ids.indexOf(a.id)).toBeLessThan(ids.indexOf(b.id))
    })
  })

  describe('getCampaignById', () => {
    it('returns the campaign when it exists', async () => {
      const created = await createCampaign({ name: 'Find Me' })
      const found = await getCampaignById(created.id)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
    })

    it('returns null for a non-existent ID', async () => {
      const result = await getCampaignById('does-not-exist')
      expect(result).toBeNull()
    })
  })

  describe('updateCampaign', () => {
    it('updates the campaign name', async () => {
      const created = await createCampaign({ name: 'Old Name' })
      const updated = await updateCampaign(created.id, { name: 'New Name' })
      expect(updated.name).toBe('New Name')
    })

    it('updates description and system independently', async () => {
      const created = await createCampaign({ name: 'Base', system: 'Pathfinder' })
      const updated = await updateCampaign(created.id, { description: 'Now described' })
      expect(updated.description).toBe('Now described')
      expect(updated.system).toBe('Pathfinder')
    })

    it('advances updatedAt after update', async () => {
      const created = await createCampaign({ name: 'Time Test' })
      await new Promise((r) => setTimeout(r, 5))
      const updated = await updateCampaign(created.id, { name: 'Updated' })
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt)
    })

    it('preserves fields not included in the update', async () => {
      const created = await createCampaign({ name: 'Keep Fields', system: 'CoC' })
      const updated = await updateCampaign(created.id, { name: 'Renamed' })
      expect(updated.system).toBe('CoC')
      expect(updated.workspaceId).toBe(created.workspaceId)
      expect(updated.createdAt).toBe(created.createdAt)
    })

    it('throws for a non-existent campaign ID', async () => {
      await expect(updateCampaign('no-such-id', { name: 'Ghost' })).rejects.toThrow(
        'Campaign not found: no-such-id'
      )
    })
  })

  describe('UpdateCampaignSchema validation', () => {
    it('rejects empty string for name', () => {
      const result = UpdateCampaignSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('accepts a partial update with only description', () => {
      const result = UpdateCampaignSchema.safeParse({ description: 'New desc' })
      expect(result.success).toBe(true)
    })

    it('accepts an empty object (no-op update)', () => {
      const result = UpdateCampaignSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('deleteCampaign', () => {
    it('removes the campaign from the database', async () => {
      const created = await createCampaign({ name: 'Delete Me' })
      await deleteCampaign(created.id)
      const found = await getCampaignById(created.id)
      expect(found).toBeNull()
    })

    it('does not throw when deleting a non-existent ID', async () => {
      await expect(deleteCampaign('ghost-id')).resolves.toBeUndefined()
    })

    it('only deletes the targeted campaign', async () => {
      const a = await createCampaign({ name: 'Keep' })
      const b = await createCampaign({ name: 'Remove' })
      await deleteCampaign(b.id)
      const remaining = await getCampaigns()
      expect(remaining.map((c) => c.id)).toContain(a.id)
      expect(remaining.map((c) => c.id)).not.toContain(b.id)
    })
  })
})
