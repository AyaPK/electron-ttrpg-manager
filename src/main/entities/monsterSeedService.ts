import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { and, eq } from 'drizzle-orm'
import { getDatabase } from '../database/connection'
import { entities } from '../database/schema'
import type { DbEntity } from '../database/schema'

// ---------------------------------------------------------------------------
// Raw JSON shape (matches the user's monster JSON format)
// ---------------------------------------------------------------------------

interface RawMonsterAction {
  name: string
  desc: string
  attack_bonus?: number
  damage_dice?: string
  damage_bonus?: number
}

interface RawMonster {
  name: string
  size?: string
  type?: string
  subtype?: string
  alignment?: string
  armor_class?: number
  hit_points?: number
  hit_dice?: string
  speed?: string
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  senses?: string
  languages?: string
  challenge_rating?: string
  damage_vulnerabilities?: string
  damage_resistances?: string
  damage_immunities?: string
  condition_immunities?: string
  special_abilities?: RawMonsterAction[]
  actions?: RawMonsterAction[]
  legendary_actions?: RawMonsterAction[]
  reactions?: RawMonsterAction[]
}

// ---------------------------------------------------------------------------
// Locate the seed JSON file
// Resolution order:
//   1. <userData>/monster-seed.json  (user can drop their own file here)
//   2. <appPath>/resources/monsters.json  (packaged app)
//   3. <appPath>/src/main/entities/seeds/monsters.json  (dev)
// ---------------------------------------------------------------------------

function findSeedFile(): string | null {
  const candidates = [
    path.join(app.getPath('userData'), 'monster-seed.json'),
    path.join(app.getAppPath(), 'resources', 'monsters.json'),
    path.join(app.getAppPath(), 'src', 'main', 'entities', 'seeds', 'monsters.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function loadSeedData(): RawMonster[] {
  const filePath = findSeedFile()
  if (!filePath) {
    console.log('[monsterSeed] No seed file found — skipping monster seed')
    return []
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      console.error('[monsterSeed] Seed file is not an array — skipping')
      return []
    }
    console.log(`[monsterSeed] Loaded ${parsed.length} monsters from ${filePath}`)
    return parsed as RawMonster[]
  } catch (err) {
    console.error('[monsterSeed] Failed to parse seed file:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Convert raw monster → entity row
// ---------------------------------------------------------------------------

function rawToEntityRow(monster: RawMonster, campaignId: string): DbEntity {
  const now = Date.now()
  const metadata = {
    type: 'monster',
    monsterType: monster.type,
    challengeRating: monster.challenge_rating,
    size: monster.size,
    subtype: monster.subtype,
    alignment: monster.alignment,
    armorClass: monster.armor_class,
    hitPoints: monster.hit_points,
    hitDice: monster.hit_dice,
    speed: monster.speed,
    strength: monster.strength,
    dexterity: monster.dexterity,
    constitution: monster.constitution,
    intelligence: monster.intelligence,
    wisdom: monster.wisdom,
    charisma: monster.charisma,
    senses: monster.senses,
    languages: monster.languages,
    damageVulnerabilities: monster.damage_vulnerabilities,
    damageResistances: monster.damage_resistances,
    damageImmunities: monster.damage_immunities,
    conditionImmunities: monster.condition_immunities,
    specialAbilities: monster.special_abilities,
    actions: monster.actions,
    legendaryActions: monster.legendary_actions,
    reactions: monster.reactions,
  }

  return {
    id: randomUUID(),
    campaignId,
    type: 'monster',
    name: monster.name,
    description: monster.type ? `${monster.size ?? ''} ${monster.type}${monster.subtype ? ` (${monster.subtype})` : ''}`.trim() : null,
    visibility: 'campaign',
    metadata: JSON.stringify(metadata),
    createdAt: now,
    updatedAt: now,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seeds all monsters from the seed file into a campaign.
 * Skips any monster whose name already exists in that campaign (idempotent).
 * Returns the count of monsters actually inserted.
 */
export async function seedMonstersForCampaign(campaignId: string): Promise<number> {
  const rawMonsters = loadSeedData()
  if (rawMonsters.length === 0) return 0

  const db = getDatabase()

  // Load existing monster names in this campaign to avoid duplicates
  const existing = await db
    .select({ name: entities.name })
    .from(entities)
    .where(and(eq(entities.campaignId, campaignId), eq(entities.type, 'monster')))

  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  const toInsert = rawMonsters
    .filter((m) => m.name && !existingNames.has(m.name.toLowerCase()))
    .map((m) => rawToEntityRow(m, campaignId))

  if (toInsert.length === 0) {
    console.log(`[monsterSeed] All monsters already seeded for campaign ${campaignId}`)
    return 0
  }

  // Insert in batches of 100 to avoid SQLite limits
  const BATCH = 100
  for (let i = 0; i < toInsert.length; i += BATCH) {
    await db.insert(entities).values(toInsert.slice(i, i + BATCH))
  }

  console.log(`[monsterSeed] Seeded ${toInsert.length} monsters into campaign ${campaignId}`)
  return toInsert.length
}
