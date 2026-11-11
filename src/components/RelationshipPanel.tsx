import { useEffect, useState } from 'react'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import type { Entity, Relationship } from '../types/electron.d'
import { RELATIONSHIP_TYPES, RELATIONSHIP_LABELS } from '../types/electron.d'
import { EntityTypeBadge } from './ui/EntityTypeBadge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { useAppStore } from '../store/useAppStore'

interface RelationshipPanelProps {
  entity: Entity
}

export function RelationshipPanel({ entity }: RelationshipPanelProps) {
  const { navigateToEntity, activeCampaign } = useAppStore()
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [allEntities, setAllEntities] = useState<Entity[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Relationship | null>(null)
  const [form, setForm] = useState({ targetEntityId: '', relationshipType: 'related_to', description: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const rels = await window.api.relationships.list(entity.id)
    setRelationships(rels)
  }

  const loadEntities = async () => {
    if (!activeCampaign) return
    const list = await window.api.entities.list(activeCampaign.id)
    setAllEntities(list.filter((e) => e.id !== entity.id))
  }

  useEffect(() => { load() }, [entity.id])

  const openAdd = () => {
    setForm({ targetEntityId: '', relationshipType: 'related_to', description: '' })
    loadEntities()
    setShowAdd(true)
  }

  const handleSave = async () => {
    if (!form.targetEntityId || !activeCampaign) return
    setSaving(true)
    await window.api.relationships.create({
      campaignId: activeCampaign.id,
      sourceEntityId: entity.id,
      targetEntityId: form.targetEntityId,
      relationshipType: form.relationshipType,
      description: form.description,
    })
    setSaving(false)
    setShowAdd(false)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.api.relationships.delete(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Relationships
        </h3>
        <Button onClick={openAdd} icon={<Plus size={13} />} style={{ padding: '5px 10px', fontSize: 12 }}>
          Link
        </Button>
      </div>

      {relationships.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
          No relationships yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {relationships.map((rel) => {
            const isSource = rel.sourceEntityId === entity.id
            const other = isSource ? rel.targetEntity : rel.sourceEntity
            if (!other) return null

            return (
              <RelCard
                key={rel.id}
                rel={rel}
                other={other}
                isSource={isSource}
                onNavigate={() => navigateToEntity(other.id)}
                onDelete={() => setDeleteTarget(rel)}
              />
            )
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Link Entity" onClose={() => setShowAdd(false)} width={440}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Relationship Type</label>
              <select value={form.relationshipType} onChange={(e) => setForm({ ...form, relationshipType: e.target.value })} style={{ width: '100%' }}>
                {RELATIONSHIP_TYPES.map((rt) => (
                  <option key={rt} value={rt}>{RELATIONSHIP_LABELS[rt] ?? rt}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Target Entity</label>
              <select value={form.targetEntityId} onChange={(e) => setForm({ ...form, targetEntityId: e.target.value })} style={{ width: '100%' }}>
                <option value="">Select entity...</option>
                {allEntities.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Note (optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. since the Battle of Ashford"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving} disabled={!form.targetEntityId}>Link</Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Remove Relationship" onClose={() => setDeleteTarget(null)}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Remove this relationship? The entities themselves won't be deleted.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Remove</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function RelCard({ rel, other, isSource, onNavigate, onDelete }: {
  rel: Relationship
  other: Entity
  isSource: boolean
  onNavigate: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        borderRadius: 8,
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {!isSource && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>←</span>}
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
            {RELATIONSHIP_LABELS[rel.relationshipType] ?? rel.relationshipType}
          </span>
          {isSource && <ArrowRight size={11} color="var(--text-muted)" />}
        </div>
        <button
          onClick={onNavigate}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{other.name}</span>
          <EntityTypeBadge type={other.type} />
        </button>
        {rel.description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{rel.description}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 4,
          display: 'flex',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.1s',
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  fontWeight: 500,
}
