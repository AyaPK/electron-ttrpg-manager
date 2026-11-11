import { describe, it, expect } from 'vitest'
import { setupTestEnvironment } from './helpers/setupTestDb'

/**
 * Integration tests for the campaigns IPC handler layer.
 *
 * We cannot import ipcMain in a Node test environment, so we test the handler
 * logic by calling the service functions it delegates to directly — the same
 * code path that runs when IPC messages are received.  This exercises the full
 * handler → service → Drizzle → SQLite stack without Electron.
 */
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from '../main/campaigns/campaignService'

describe('campaign IPC handler logic (integration)', () => {
  setupTestEnvironment()

  describe('campaigns:list', () => {
    it('returns an empty array before any campaigns are created', async () => {
      const result = await getCampaigns()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('reflects campaigns after creation', async () => {
      await createCampaign({ name: 'First' })
      await createCampaign({ name: 'Second' })
      const result = await getCampaigns()
      expect(result).toHaveLength(2)
      expect(result.map((c) => c.name)).toContain('First')
      expect(result.map((c) => c.name)).toContain('Second')
    })
  })

  describe('campaigns:get', () => {
    it('returns a campaign by id', async () => {
      const created = await createCampaign({ name: 'Findable' })
      const result = await getCampaignById(created.id)
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Findable')
    })

    it('returns null for an unknown id', async () => {
      const result = await getCampaignById('unknown-id-xyz')
      expect(result).toBeNull()
    })
  })

  describe('campaigns:create', () => {
    it('persists a new campaign and returns it', async () => {
      const result = await createCampaign({
        name: 'Persisted',
        description: 'Desc',
        system: 'PF2e',
      })

      expect(result.id).toBeTypeOf('string')
      expect(result.name).toBe('Persisted')
      expect(result.description).toBe('Desc')
      expect(result.system).toBe('PF2e')

      const fetched = await getCampaignById(result.id)
      expect(fetched).not.toBeNull()
      expect(fetched!.name).toBe('Persisted')
    })

    it('stores null for omitted optional fields', async () => {
      const result = await createCampaign({ name: 'Minimal' })
      expect(result.description).toBeNull()
      expect(result.system).toBeNull()
    })

    it('rejects an empty name via Zod', async () => {
      await expect(createCampaign({ name: '' })).rejects.toThrow()
    })
  })

  describe('campaigns:update', () => {
    it('returns the updated campaign', async () => {
      const created = await createCampaign({ name: 'Before' })
      const result = await updateCampaign(created.id, { name: 'After' })
      expect(result.name).toBe('After')
      expect(result.id).toBe(created.id)
    })

    it('the updated data is reflected on subsequent fetch', async () => {
      const created = await createCampaign({ name: 'Draft', system: 'OSR' })
      await updateCampaign(created.id, { name: 'Published', description: 'Now live' })

      const fetched = await getCampaignById(created.id)
      expect(fetched!.name).toBe('Published')
      expect(fetched!.description).toBe('Now live')
      expect(fetched!.system).toBe('OSR')
    })

    it('throws when updating a non-existent campaign', async () => {
      await expect(updateCampaign('no-such-id', { name: 'Ghost' })).rejects.toThrow(
        'Campaign not found: no-such-id'
      )
    })
  })

  describe('campaigns:delete', () => {
    it('removes the campaign so subsequent fetch returns null', async () => {
      const created = await createCampaign({ name: 'ToDelete' })
      await deleteCampaign(created.id)
      const fetched = await getCampaignById(created.id)
      expect(fetched).toBeNull()
    })

    it('removes the campaign from the list', async () => {
      const a = await createCampaign({ name: 'Stay' })
      const b = await createCampaign({ name: 'Go' })
      await deleteCampaign(b.id)
      const list = await getCampaigns()
      expect(list.map((c) => c.id)).toContain(a.id)
      expect(list.map((c) => c.id)).not.toContain(b.id)
    })

    it('resolves without error for a non-existent id', async () => {
      await expect(deleteCampaign('phantom')).resolves.toBeUndefined()
    })
  })

  describe('end-to-end campaign lifecycle', () => {
    it('create → list → update → delete completes without error', async () => {
      const created = await createCampaign({ name: 'Lifecycle', system: 'FATE' })
      expect((await getCampaigns()).map((c) => c.id)).toContain(created.id)

      const updated = await updateCampaign(created.id, { name: 'Lifecycle Updated' })
      expect(updated.name).toBe('Lifecycle Updated')

      await deleteCampaign(created.id)
      expect(await getCampaignById(created.id)).toBeNull()
    })
  })
})
