import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, X, Trash2, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Entity, EntityType } from '../types/electron.d'
import { EntityTypeBadge } from './ui/EntityTypeBadge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { EntityForm } from './EntityForm'

const TYPE_FILTERS: { type: EntityType | null; label: string }[] = [
  { type: null, label: 'All' },
  { type: 'npc', label: 'NPCs' },
  { type: 'location', label: 'Locations' },
  { type: 'faction', label: 'Factions' },
  { type: 'item', label: 'Items' },
]

export function EntityList() {
  const {
    activeCampaign,
    entityTypeFilter,
    searchQuery,
    setEntityTypeFilter,
    setSearchQuery,
    navigateToEntity,
  } = useAppStore()

  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    setLoading(true)
    const list = await window.api.entities.list(activeCampaign.id, {
      type: entityTypeFilter ?? undefined,
      search: searchQuery || undefined,
    })
    setEntities(list.reverse())
    setLoading(false)
  }, [activeCampaign, entityTypeFilter, searchQuery])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.api.entities.delete(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const handleCreated = () => {
    setShowCreate(false)
    load()
  }

  const title = entityTypeFilter
    ? `${entityTypeFilter.charAt(0).toUpperCase() + entityTypeFilter.slice(1)}s`
    : 'All Entities'

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
        <Button onClick={() => setShowCreate(true)} icon={<Plus size={15} />}>New Entity</Button>
      </div>

      <div style={toolbarStyle}>
        <div style={filterRow}>
          {TYPE_FILTERS.map(({ type, label }) => (
            <FilterChip
              key={label}
              label={label}
              active={entityTypeFilter === type}
              onClick={() => setEntityTypeFilter(type)}
            />
          ))}
        </div>
        <div style={searchWrap}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            style={{ paddingLeft: 32, paddingRight: searchQuery ? 32 : 12, width: '100%' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={clearBtn}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={listStyle}>
        {loading ? (
          <div style={emptyStyle}><span style={{ color: 'var(--text-muted)' }}>Loading...</span></div>
        ) : entities.length === 0 ? (
          <div style={emptyStyle}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
              {searchQuery ? `No entities match "${searchQuery}"` : 'No entities yet.'}
            </p>
            {!searchQuery && <Button onClick={() => setShowCreate(true)} icon={<Plus size={15} />}>Create entity</Button>}
          </div>
        ) : (
          entities.map((entity) => (
            <EntityRow
              key={entity.id}
              entity={entity}
              onOpen={() => navigateToEntity(entity.id)}
              onDelete={() => setDeleteTarget(entity)}
            />
          ))
        )}
      </div>

      {showCreate && activeCampaign && (
        <Modal title="New Entity" onClose={() => setShowCreate(false)} width={520}>
          <EntityForm
            campaignId={activeCampaign.id}
            defaultType={entityTypeFilter ?? undefined}
            onSaved={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Entity" onClose={() => setDeleteTarget(null)}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>? This will also remove all its relationships.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EntityRow({ entity, onOpen, onDelete }: { entity: Entity; onOpen: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: 8,
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.1s',
        gap: 12,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{entity.name}</span>
          <EntityTypeBadge type={entity.type} />
          {entity.visibility === 'private' && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 10 }}>Private</span>
          )}
        </div>
        {entity.description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entity.description.replace(/<[^>]+>/g, '')}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 5, borderRadius: 4, display: 'flex', opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <ChevronRight size={14} color={hovered ? 'var(--text-secondary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 12px',
        borderRadius: 20,
        border: active ? 'none' : '1px solid var(--border)',
        background: active ? 'var(--accent)' : hovered ? 'var(--bg-hover)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
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
  padding: '24px 24px 16px',
  borderBottom: '1px solid var(--border)',
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 24px',
  borderBottom: '1px solid var(--border)',
  flexWrap: 'wrap',
}

const filterRow: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
}

const searchWrap: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  minWidth: 180,
  maxWidth: 300,
}

const clearBtn: React.CSSProperties = {
  position: 'absolute',
  right: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: 2,
}

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 16px',
}

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 24px',
}
