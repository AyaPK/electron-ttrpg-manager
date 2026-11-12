import { useEffect, useState } from 'react'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Entity, NpcMetadata, LocationMetadata, FactionMetadata, ItemMetadata, MonsterMetadata, PlayerMetadata } from '../types/electron.d'
import { EntityTypeBadge } from './ui/EntityTypeBadge'
import { RichTextEditor } from './ui/RichTextEditor'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { EntityForm } from './EntityForm'
import { RelationshipPanel } from './RelationshipPanel'

export function EntityDetail() {
  const { selectedEntityId, activeCampaign, navigateToEntityList, entityTypeFilter } = useAppStore()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const load = async (id: string) => {
    if (!activeCampaign) return
    setLoading(true)
    const e = await window.api.entities.get(id, activeCampaign.id)
    setEntity(e)
    setLoading(false)
  }

  useEffect(() => {
    if (selectedEntityId) load(selectedEntityId)
  }, [selectedEntityId])

  const handleSaved = () => {
    setEditing(false)
    if (selectedEntityId) load(selectedEntityId)
  }

  const handleDelete = async () => {
    if (!entity || !activeCampaign) return
    await window.api.entities.delete(entity.id, activeCampaign.id)
    navigateToEntityList(entityTypeFilter)
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
      </div>
    )
  }

  if (!entity) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>Entity not found.</span>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button onClick={() => navigateToEntityList(entityTypeFilter)} style={backBtn}>
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => setEditing(true)} icon={<Edit2 size={14} />}>Edit</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)} icon={<Trash2 size={14} />}>Delete</Button>
        </div>
      </div>

      <div style={contentLayout}>
        <div style={mainCol}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{entity.name}</h1>
              <EntityTypeBadge type={entity.type} size="md" />
              {entity.visibility === 'private' && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 10 }}>Private</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Created {new Date(entity.createdAt).toLocaleDateString()} · Updated {new Date(entity.updatedAt).toLocaleDateString()}
            </p>
          </div>

          <MetadataSection entity={entity} />

          {entity.description && (
            <div style={{ marginTop: 24 }}>
              <h3 style={sectionHeading}>Description</h3>
              <div style={descriptionBox}>
                <RichTextEditor content={entity.description} onChange={() => {}} readOnly />
              </div>
            </div>
          )}

          {!entity.description && (
            <div style={{ marginTop: 24, padding: 20, borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No description yet. <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Add one</button></p>
            </div>
          )}
        </div>

        <div style={sideCol}>
          <RelationshipPanel entity={entity} />
        </div>
      </div>

      {editing && (
        <Modal title={`Edit ${entity.name}`} onClose={() => setEditing(false)} width={560}>
          <EntityForm
            campaignId={entity.campaignId}
            entityId={entity.id}
            defaultType={entity.type}
            initialValues={{
              name: entity.name,
              type: entity.type,
              description: entity.description,
              visibility: entity.visibility as 'private' | 'campaign' | 'players',
              metadata: entity.metadata as Record<string, unknown>,
            }}
            onSaved={handleSaved}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete Entity" onClose={() => setShowDelete(false)}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Delete <strong style={{ color: 'var(--text-primary)' }}>{entity.name}</strong>? This will also remove all its relationships.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function MetadataSection({ entity }: { entity: Entity }) {
  const meta = entity.metadata as Record<string, string>
  const fields: { label: string; value: string }[] = []

  if (entity.type === 'npc') {
    const m = meta as unknown as NpcMetadata
    if (m.occupation) fields.push({ label: 'Occupation', value: m.occupation })
    if (m.race) fields.push({ label: 'Race', value: m.race })
    if (m.affiliation) fields.push({ label: 'Affiliation', value: m.affiliation })
    if (m.personality) fields.push({ label: 'Personality', value: m.personality })
  } else if (entity.type === 'location') {
    const m = meta as unknown as LocationMetadata
    if (m.locationType) fields.push({ label: 'Type', value: m.locationType })
    if (m.region) fields.push({ label: 'Region', value: m.region })
    if (m.population) fields.push({ label: 'Population', value: m.population })
  } else if (entity.type === 'faction') {
    const m = meta as unknown as FactionMetadata
    if (m.alignment) fields.push({ label: 'Alignment', value: m.alignment })
    if (m.headquarters) fields.push({ label: 'Headquarters', value: m.headquarters })
    if (m.goals) fields.push({ label: 'Goals', value: m.goals })
  } else if (entity.type === 'item') {
    const m = meta as unknown as ItemMetadata
    if (m.itemType) fields.push({ label: 'Item Type', value: m.itemType })
    if (m.rarity) fields.push({ label: 'Rarity', value: m.rarity })
  } else if (entity.type === 'monster') {
    const m = meta as unknown as MonsterMetadata
    if (m.monsterType) fields.push({ label: 'Type', value: m.monsterType })
    if (m.challengeRating) fields.push({ label: 'CR', value: m.challengeRating })
    if (m.habitat) fields.push({ label: 'Habitat', value: m.habitat })
  } else if (entity.type === 'player') {
    const m = meta as unknown as PlayerMetadata
    if (m.playerClass) fields.push({ label: 'Class', value: m.playerClass })
    if (m.race) fields.push({ label: 'Race', value: m.race })
    if (m.level) fields.push({ label: 'Level', value: m.level })
    if (m.player) fields.push({ label: 'Player', value: m.player })
  }

  if (fields.length === 0) return null

  return (
    <div style={metaGrid}>
      {fields.map(({ label, value }) => (
        <div key={label} style={metaCard}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
          <span style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 4 }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 24px',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
}

const backBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  padding: '5px 8px',
  borderRadius: 6,
}

const contentLayout: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
  gap: 0,
}

const mainCol: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '28px 32px',
}

const sideCol: React.CSSProperties = {
  width: 300,
  flexShrink: 0,
  borderLeft: '1px solid var(--border)',
  overflowY: 'auto',
  padding: '24px 20px',
  background: 'var(--bg-secondary)',
}

const sectionHeading: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 10px',
}

const descriptionBox: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  borderRadius: 8,
  padding: '14px 16px',
  border: '1px solid var(--border)',
}

const metaGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 8,
}

const metaCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 14px',
  minWidth: 120,
}
