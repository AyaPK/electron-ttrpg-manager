import { useState } from 'react'
import type { EntityType, NpcMetadata, LocationMetadata, FactionMetadata, ItemMetadata, MonsterMetadata, PlayerMetadata } from '../types/electron.d'
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

      <MetadataFields type={type} metadata={metadata} setMeta={setMeta} />

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

function MetadataFields({ type, metadata, setMeta }: { type: EntityType; metadata: Record<string, unknown>; setMeta: (k: string, v: string) => void }) {
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
    return (
      <>
        <Input label="Monster Type" value={m.monsterType ?? ''} onChange={(v) => setMeta('monsterType', v)} placeholder="Beast, undead, dragon, humanoid..." />
        <Input label="Challenge Rating" value={m.challengeRating ?? ''} onChange={(v) => setMeta('challengeRating', v)} placeholder="1/4, 1, 5, 20..." />
        <Input label="Habitat" value={m.habitat ?? ''} onChange={(v) => setMeta('habitat', v)} placeholder="Forest, dungeon, arctic..." />
      </>
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

  return <input type="hidden" value={str('_')} />
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  fontWeight: 500,
}
