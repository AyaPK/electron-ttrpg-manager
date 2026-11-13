import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { and, eq } from 'drizzle-orm'
import { getDatabase } from '../database/connection'
import { entities } from '../database/schema'
import type { DbEntity } from '../database/schema'

// ---------------------------------------------------------------------------
// Raw JSON shape (matches user's spell JSON format)
// ---------------------------------------------------------------------------

interface RawSpell {
  name: string
  desc?: string
  higher_level?: string
  page?: string
  range?: string
  components?: string
  ritual?: string
  duration?: string
  concentration?: string
  casting_time?: string
  level?: string
  school?: string
  class?: string
}

// ---------------------------------------------------------------------------
// Locate seed file
// Resolution order:
//   1. <userData>/spell-seed.json
//   2. <appPath>/resources/spells.json
//   3. <appPath>/src/main/entities/seeds/spells.json  (dev)
// ---------------------------------------------------------------------------

function findSeedFile(): string | null {
  const candidates = [
    path.join(app.getPath('userData'), 'spell-seed.json'),
    path.join(app.getAppPath(), 'resources', 'spells.json'),
    path.join(app.getAppPath(), 'src', 'main', 'entities', 'seeds', 'spells.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function loadSeedData(): RawSpell[] {
  const filePath = findSeedFile()
  if (!filePath) {
    console.log('[spellSeed] No seed file found — skipping spell seed')
    return []
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      console.error('[spellSeed] Seed file is not an array — skipping')
      return []
    }
    console.log(`[spellSeed] Loaded ${parsed.length} spells from ${filePath}`)
    return parsed as RawSpell[]
  } catch (err) {
    console.error('[spellSeed] Failed to parse seed file:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Convert raw spell → entity row
// ---------------------------------------------------------------------------

function rawToEntityRow(spell: RawSpell, campaignId: string): DbEntity {
  const now = Date.now()
  const metadata = {
    type: 'spell',
    level: spell.level,
    school: spell.school,
    castingTime: spell.casting_time,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    concentration: spell.concentration,
    ritual: spell.ritual,
    spellClass: spell.class,
    higherLevel: spell.higher_level,
    page: spell.page,
  }

  // Strip HTML from desc for entity description field
  const plainDesc = spell.desc
    ? spell.desc.replace(/<[^>]+>/g, '').trim()
    : null

  return {
    id: randomUUID(),
    campaignId,
    type: 'spell',
    name: spell.name,
    description: plainDesc,
    visibility: 'campaign',
    metadata: JSON.stringify(metadata),
    createdAt: now,
    updatedAt: now,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function seedSpellsForCampaign(campaignId: string): Promise<number> {
  const rawSpells = loadSeedData()
  if (rawSpells.length === 0) return 0

  const db = getDatabase()

  const existing = await db
    .select({ name: entities.name })
    .from(entities)
    .where(and(eq(entities.campaignId, campaignId), eq(entities.type, 'spell')))

  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  const toInsert = rawSpells
    .filter((s) => s.name && !existingNames.has(s.name.toLowerCase()))
    .map((s) => rawToEntityRow(s, campaignId))

  if (toInsert.length === 0) {
    console.log(`[spellSeed] All spells already seeded for campaign ${campaignId}`)
    return 0
  }

  const BATCH = 100
  for (let i = 0; i < toInsert.length; i += BATCH) {
    await db.insert(entities).values(toInsert.slice(i, i + BATCH))
  }

  console.log(`[spellSeed] Seeded ${toInsert.length} spells into campaign ${campaignId}`)
  return toInsert.length
}
