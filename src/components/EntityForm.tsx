import { useState } from 'react'
import type { EntityType, NpcMetadata, LocationMetadata, FactionMetadata, ItemMetadata, MonsterMetadata, PlayerMetadata, SpellMetadata } from '../types/electron.d'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { RichTextEditor } from './ui/RichTextEditor'

interface EntityFormProps {
  campaignId: string
  defaultType?: EntityType
  onSaved: () => void
  onCancel: () => void
  initialValues?: {
    name: string
    type: EntityType
    description: string | null
    visibility: 'private' | 'campaign' | 'players'
    metadata: Record<string, unknown>
  }
  entityId?: string
}

const TYPES: { value: EntityType; label: string }[] = [
  { value: 'npc', label: 'NPC' },
  { value: 'monster', label: 'Monster' },
  { value: 'spell', label: 'Spell' },
  { value: 'location', label: 'Location' },
  { value: 'player', label: 'Player' },
  { value: 'faction', label: 'Faction' },
  { value: 'item', label: 'Item' },
]

export function EntityForm({ campaignId, defaultType = 'npc', onSaved, onCancel, initialValues, entityId }: EntityFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [type, setType] = useState<EntityType>(initialValues?.type ?? defaultType)
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [visibility, setVisibility] = useState<'private' | 'campaign' | 'players'>(initialValues?.visibility ?? 'campaign')
  const [metadata, setMetadata] = useState<Record<string, unknown>>(initialValues?.metadata ?? {})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (entityId) {
      await window.api.entities.update(entityId, campaignId, { name, description: description || undefined, visibility, metadata })
    } else {
      await window.api.entities.create({
        campaignId,
        type,
        name,
        description: description || undefined,
        visibility,
        metadata: { ...metadata, type },
      })
    }
    setSaving(false)
    onSaved()
  }

  const setMeta = (key: string, value: string) => setMetadata((m) => ({ ...m, [key]: value }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input label="Name" value={name} onChange={setName} placeholder="Entity name" autoFocus />

      {!entityId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setType(value); setMetadata({}) }}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 7,
                  border: type === value ? 'none' : '1px solid var(--border)',
                  background: type === value ? 'var(--accent)' : 'transparent',
                  color: type === value ? '#fff' : 'var(--text-secondary)',
                  fontWeight: type === value ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>Description</label>
        <RichTextEditor content={description} onChange={setDescription} placeholder="Describe this entity..." />
      </div>

      <MetadataFields type={type} metadata={metadata} setMeta={setMeta} setMetadata={setMetadata} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>Visibility</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['private', 'campaign', 'players'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: visibility === v ? 'none' : '1px solid var(--border)',
                background: visibility === v ? 'var(--bg-active)' : 'transparent',
                color: visibility === v ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: visibility === v ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} loading={saving} disabled={!name.trim()}>
          {entityId ? 'Save Changes' : 'Create Entity'}
        </Button>
      </div>
    </div>
  )
}

const twoCol: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}

const sixCol: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: 8,
}

const metaSectionHead: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  borderBottom: '1px solid var(--border)',
  paddingBottom: 6,
  marginBottom: -4,
}

const numInput: React.CSSProperties = {
  width: '100%',
  padding: '7px 8px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 14,
  textAlign: 'center' as const,
  boxSizing: 'border-box' as const,
}

function MetadataFields({ type, metadata, setMeta, setMetadata }: { type: EntityType; metadata: Record<string, unknown>; setMeta: (k: string, v: string) => void; setMetadata: React.Dispatch<React.SetStateAction<Record<string, unknown>>> }) {
  const str = (k: string) => ((metadata as Record<string, string>)[k]) ?? ''

  if (type === 'npc') {
    const m = metadata as unknown as NpcMetadata
    return (
      <>
        <Input label="Occupation" value={m.occupation ?? ''} onChange={(v) => setMeta('occupation', v)} placeholder="Knight, merchant, priest..." />
        <Input label="Race" value={m.race ?? ''} onChange={(v) => setMeta('race', v)} placeholder="Human, elf, dwarf..." />
        <Input label="Affiliation" value={m.affiliation ?? ''} onChange={(v) => setMeta('affiliation', v)} placeholder="Faction or group..." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Personality</label>
          <textarea rows={2} value={m.personality ?? ''} onChange={(e) => setMeta('personality', e.target.value)} placeholder="Brave, cunning, shy..." style={{ resize: 'vertical', width: '100%' }} />
        </div>
      </>
    )
  }

  if (type === 'location') {
    const m = metadata as unknown as LocationMetadata
    return (
      <>
        <Input label="Location Type" value={m.locationType ?? ''} onChange={(v) => setMeta('locationType', v)} placeholder="City, dungeon, forest, tavern..." />
        <Input label="Region" value={m.region ?? ''} onChange={(v) => setMeta('region', v)} placeholder="Northern Reach, Underdark..." />
        <Input label="Population" value={m.population ?? ''} onChange={(v) => setMeta('population', v)} placeholder="Sparse, hundreds, thousands..." />
      </>
    )
  }

  if (type === 'faction') {
    const m = metadata as unknown as FactionMetadata
    return (
      <>
        <Input label="Alignment" value={m.alignment ?? ''} onChange={(v) => setMeta('alignment', v)} placeholder="Lawful good, chaotic evil..." />
        <Input label="Headquarters" value={m.headquarters ?? ''} onChange={(v) => setMeta('headquarters', v)} placeholder="Location of base..." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Goals</label>
          <textarea rows={2} value={m.goals ?? ''} onChange={(e) => setMeta('goals', e.target.value)} placeholder="Domination, peace, revenge..." style={{ resize: 'vertical', width: '100%' }} />
        </div>
      </>
    )
  }

  if (type === 'item') {
    const m = metadata as unknown as ItemMetadata
    return (
      <>
        <Input label="Item Type" value={m.itemType ?? ''} onChange={(v) => setMeta('itemType', v)} placeholder="Weapon, armour, artifact, consumable..." />
        <Input label="Rarity" value={m.rarity ?? ''} onChange={(v) => setMeta('rarity', v)} placeholder="Common, uncommon, rare, legendary..." />
      </>
    )
  }

  if (type === 'monster') {
    const m = metadata as unknown as MonsterMetadata
    const num = (k: string) => ((metadata as Record<string, number>)[k])?.toString() ?? ''
    const setNum = (k: string, v: string) => {
      const n = parseInt(v, 10)
      if (!isNaN(n)) setMetadata((prev) => ({ ...prev, [k]: n }))
      else if (v === '') setMetadata((prev) => { const next = { ...prev }; delete next[k]; return next })
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Core identity */}
        <div style={metaSectionHead}>Identity</div>
        <div style={twoCol}>
          <Input label="Monster Type" value={m.monsterType ?? ''} onChange={(v) => setMeta('monsterType', v)} placeholder="humanoid, beast, undead..." />
          <Input label="Subtype" value={m.subtype ?? ''} onChange={(v) => setMeta('subtype', v)} placeholder="goblinoid, shapechanger..." />
        </div>
        <div style={twoCol}>
          <Input label="Size" value={m.size ?? ''} onChange={(v) => setMeta('size', v)} placeholder="Tiny, Small, Medium, Large..." />
          <Input label="Alignment" value={m.alignment ?? ''} onChange={(v) => setMeta('alignment', v)} placeholder="neutral evil..." />
        </div>
        <div style={twoCol}>
          <Input label="Challenge Rating" value={m.challengeRating ?? ''} onChange={(v) => setMeta('challengeRating', v)} placeholder="1/4, 1, 5, 20..." />
          <Input label="Habitat" value={m.habitat ?? ''} onChange={(v) => setMeta('habitat', v)} placeholder="Forest, dungeon, arctic..." />
        </div>

        {/* Combat stats */}
        <div style={metaSectionHead}>Combat</div>
        <div style={twoCol}>
          <Input label="Armour Class" value={num('armorClass')} onChange={(v) => setNum('armorClass', v)} placeholder="15" />
          <Input label="Hit Points" value={num('hitPoints')} onChange={(v) => setNum('hitPoints', v)} placeholder="45" />
        </div>
        <div style={twoCol}>
          <Input label="Hit Dice" value={m.hitDice ?? ''} onChange={(v) => setMeta('hitDice', v)} placeholder="6d8+12" />
          <Input label="Speed" value={m.speed ?? ''} onChange={(v) => setMeta('speed', v)} placeholder="30 ft., fly 60 ft." />
        </div>

        {/* Ability scores */}
        <div style={metaSectionHead}>Ability Scores</div>
        <div style={sixCol}>
          {(['strength','dexterity','constitution','intelligence','wisdom','charisma'] as const).map((ab) => (
            <div key={ab} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{ab.slice(0,3).toUpperCase()}</label>
              <input
                type="number" min={1} max={30}
                value={num(ab)}
                onChange={(e) => setNum(ab, e.target.value)}
                style={numInput}
              />
            </div>
          ))}
        </div>

        {/* Senses & Languages */}
        <div style={metaSectionHead}>Traits</div>
        <Input label="Senses" value={m.senses ?? ''} onChange={(v) => setMeta('senses', v)} placeholder="darkvision 60 ft., passive Perception 9" />
        <Input label="Languages" value={m.languages ?? ''} onChange={(v) => setMeta('languages', v)} placeholder="Common, Goblin" />
        <div style={twoCol}>
          <Input label="Damage Resistances" value={m.damageResistances ?? ''} onChange={(v) => setMeta('damageResistances', v)} placeholder="bludgeoning, fire" />
          <Input label="Damage Immunities" value={m.damageImmunities ?? ''} onChange={(v) => setMeta('damageImmunities', v)} placeholder="poison, psychic" />
        </div>
        <div style={twoCol}>
          <Input label="Damage Vulnerabilities" value={m.damageVulnerabilities ?? ''} onChange={(v) => setMeta('damageVulnerabilities', v)} placeholder="" />
          <Input label="Condition Immunities" value={m.conditionImmunities ?? ''} onChange={(v) => setMeta('conditionImmunities', v)} placeholder="poisoned, frightened" />
        </div>
      </div>
    )
  }

  if (type === 'player') {
    const m = metadata as unknown as PlayerMetadata
    return (
      <>
        <Input label="Class" value={m.playerClass ?? ''} onChange={(v) => setMeta('playerClass', v)} placeholder="Fighter, wizard, rogue..." />
        <Input label="Race" value={m.race ?? ''} onChange={(v) => setMeta('race', v)} placeholder="Human, elf, dwarf..." />
        <Input label="Level" value={m.level ?? ''} onChange={(v) => setMeta('level', v)} placeholder="1-20" />
        <Input label="Player Name" value={m.player ?? ''} onChange={(v) => setMeta('player', v)} placeholder="Real-world player's name..." />
      </>
    )
  }

  if (type === 'spell') {
    const m = metadata as unknown as SpellMetadata
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={metaSectionHead}>Identity</div>
        <div style={twoCol}>
          <Input label="Level" value={m.level ?? ''} onChange={(v) => setMeta('level', v)} placeholder="1st-level, Cantrip..." />
          <Input label="School" value={m.school ?? ''} onChange={(v) => setMeta('school', v)} placeholder="Evocation, Illusion..." />
        </div>
        <Input label="Class" value={m.spellClass ?? ''} onChange={(v) => setMeta('spellClass', v)} placeholder="Wizard, Sorcerer, Cleric..." />
        <div style={metaSectionHead}>Casting</div>
        <div style={twoCol}>
          <Input label="Casting Time" value={m.castingTime ?? ''} onChange={(v) => setMeta('castingTime', v)} placeholder="1 action, 1 bonus action..." />
          <Input label="Range" value={m.range ?? ''} onChange={(v) => setMeta('range', v)} placeholder="120 feet, Self, Touch..." />
        </div>
        <div style={twoCol}>
          <Input label="Duration" value={m.duration ?? ''} onChange={(v) => setMeta('duration', v)} placeholder="Instantaneous, 1 hour..." />
          <Input label="Components" value={m.components ?? ''} onChange={(v) => setMeta('components', v)} placeholder="V, S, M..." />
        </div>
        <div style={twoCol}>
          <Input label="Concentration" value={m.concentration ?? ''} onChange={(v) => setMeta('concentration', v)} placeholder="yes / no" />
          <Input label="Ritual" value={m.ritual ?? ''} onChange={(v) => setMeta('ritual', v)} placeholder="yes / no" />
        </div>
        <Input label="Source Page" value={m.page ?? ''} onChange={(v) => setMeta('page', v)} placeholder="phb 257" />
      </div>
    )
  }

  return <input type="hidden" value={str('_')} />
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  fontWeight: 500,
}
