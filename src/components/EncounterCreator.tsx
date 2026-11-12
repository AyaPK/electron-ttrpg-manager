import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, Check, X, Swords, Search, Skull } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Encounter, EncounterGroup, EncounterEntry, Entity } from '../types/electron.d'
import { calcDifficulty, DIFFICULTY_COLORS, VALID_CRS, crToXp } from '../utils/crUtils'

// ---------------------------------------------------------------------------
// Add enemy modal — pick from monster entities or enter custom
// ---------------------------------------------------------------------------

interface EnemyChoice {
  name: string
  cr: string
}

function AddEnemyModal({
  campaignId,
  onAdd,
  onClose,
}: {
  campaignId: string
  onAdd: (choice: EnemyChoice) => void
  onClose: () => void
}) {
  const [monsters, setMonsters] = useState<Entity[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'entities' | 'custom'>('entities')
  const [customName, setCustomName] = useState('')
  const [customCr, setCustomCr] = useState('1')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.entities.list(campaignId, { type: 'monster' }).then(setMonsters)
    setTimeout(() => searchRef.current?.focus(), 50)
  }, [])

  const filtered = monsters.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  )

  const crFromEntity = (e: Entity): string => {
    const meta = e.metadata as Record<string, string>
    return meta?.challengeRating ?? '1'
  }

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalBox, width: 460 }} onClick={(ev) => ev.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Enemy</h3>
          <button onClick={onClose} style={{ ...tinyBtn, fontSize: 18, padding: 4 }}><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
          {(['entities', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: tab === t ? 600 : 400,
                fontSize: 13,
                padding: '6px 14px 10px',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {t === 'entities' ? 'From World Bible' : 'Custom Enemy'}
            </button>
          ))}
        </div>

        {tab === 'entities' ? (
          <>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monsters..."
                style={{ ...textInput, paddingLeft: 32 }}
              />
            </div>

            {/* Monster list */}
            <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 6, border: '1px solid var(--border)' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {monsters.length === 0
                    ? <>No monsters in World Bible yet.<br />Add them via the World Bible or use Custom Enemy.</>  
                    : 'No monsters match your search.'}
                </div>
              )}
              {filtered.map((m) => {
                const cr = crFromEntity(m)
                return (
                  <button
                    key={m.id}
                    onClick={() => onAdd({ name: m.name, cr })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Skull size={14} style={{ color: 'var(--monster-color)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>CR {cr}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{crToXp(cr).toLocaleString()} XP</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <label style={fieldLabel}>Name</label>
            <input
              autoFocus
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && customName.trim()) onAdd({ name: customName.trim(), cr: customCr }) }}
              placeholder="Goblin, Orc Warchief..."
              style={textInput}
            />
            <label style={{ ...fieldLabel, marginTop: 12 }}>Challenge Rating</label>
            <select value={customCr} onChange={(e) => setCustomCr(e.target.value)} style={{ ...crSelect, width: '100%', padding: '8px 10px', fontSize: 13 }}>
              {VALID_CRS.map((cr) => <option key={cr} value={cr}>CR {cr} ({crToXp(cr).toLocaleString()} XP)</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={onClose} style={cancelBtn}>Cancel</button>
              <button
                disabled={!customName.trim()}
                onClick={() => onAdd({ name: customName.trim(), cr: customCr })}
                style={{ ...cancelBtn, background: 'var(--accent)', color: '#fff', opacity: customName.trim() ? 1 : 0.4 }}
              >
                Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Encounter list panel
// ---------------------------------------------------------------------------

function EncounterList({
  encounters,
  selected,
  onSelect,
  onCreate,
  onDelete,
}: {
  encounters: Encounter[]
  selected: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}) {
  const STATUS_COLOR: Record<string, string> = {
    draft: 'var(--text-muted)',
    ready: '#4ade80',
    complete: 'var(--accent)',
  }

  return (
    <div style={{ width: 260, minWidth: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Encounters</span>
        <button onClick={onCreate} style={iconActionBtn} title="New encounter">
          <Plus size={15} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {encounters.length === 0 && (
          <div style={{ padding: '24px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No encounters yet.<br />Click + to create one.
          </div>
        )}
        {encounters.map((enc) => (
          <div
            key={enc.id}
            onClick={() => onSelect(enc.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px 9px 16px',
              cursor: 'pointer',
              background: selected === enc.id ? 'var(--bg-active)' : 'transparent',
              borderLeft: `3px solid ${selected === enc.id ? 'var(--accent)' : 'transparent'}`,
              transition: 'background 0.12s',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {enc.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: 11, color: STATUS_COLOR[enc.status] ?? 'var(--text-muted)', fontWeight: 500 }}>
                  {enc.status.charAt(0).toUpperCase() + enc.status.slice(1)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  · {enc.groups.reduce((s, g) => s + g.entries.reduce((es, e) => es + e.count, 0), 0)} enemies
                </span>
              </div>
            </div>
            <button
              onClick={(ev) => { ev.stopPropagation(); onDelete(enc.id) }}
              style={{ ...iconActionBtn, opacity: 0.5, flexShrink: 0 }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline editable text
// ---------------------------------------------------------------------------

function InlineEdit({ value, onSave, style }: { value: string; onSave: (v: string) => void; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => { onSave(draft.trim() || value); setEditing(false) }
  const cancel = () => { setDraft(value); setEditing(false) }

  if (editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
          style={{ ...style, background: 'var(--bg-hover)', border: '1px solid var(--border-light)', borderRadius: 4, padding: '2px 6px', color: 'var(--text-primary)' }}
        />
        <button onClick={commit} style={tinyBtn}><Check size={12} /></button>
        <button onClick={cancel} style={tinyBtn}><X size={12} /></button>
      </span>
    )
  }

  return (
    <span
      onDoubleClick={() => { setDraft(value); setEditing(true) }}
      style={{ ...style, cursor: 'text', borderBottom: '1px dashed transparent' }}
      title="Double-click to edit"
    >
      {value}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Entry row
// ---------------------------------------------------------------------------

function EntryRow({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: EncounterEntry
  onUpdate: (id: string, data: { name?: string; cr?: string; count?: number; notes?: string }) => void
  onDelete: (id: string) => void
}) {
  const xp = crToXp(entry.cr) * entry.count

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 16px', borderBottom: '1px solid var(--border)' }}>
      {/* Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onUpdate(entry.id, { count: Math.max(1, entry.count - 1) })}
          style={countBtn}
        >−</button>
        <span style={{ minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{entry.count}</span>
        <button
          onClick={() => onUpdate(entry.id, { count: entry.count + 1 })}
          style={countBtn}
        >+</button>
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <InlineEdit
          value={entry.name}
          onSave={(name) => onUpdate(entry.id, { name })}
          style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}
        />
      </div>

      {/* CR selector */}
      <div style={{ flexShrink: 0 }}>
        <select
          value={entry.cr}
          onChange={(e) => onUpdate(entry.id, { cr: e.target.value })}
          style={crSelect}
        >
          {VALID_CRS.map((cr) => (
            <option key={cr} value={cr}>CR {cr}</option>
          ))}
        </select>
      </div>

      {/* XP */}
      <span style={{ flexShrink: 0, minWidth: 56, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
        {xp.toLocaleString()} XP
      </span>

      {/* Delete */}
      <button onClick={() => onDelete(entry.id)} style={{ ...iconActionBtn, opacity: 0.4, flexShrink: 0 }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Group panel
// ---------------------------------------------------------------------------

function GroupPanel({
  group,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onUpdateGroup,
  onDeleteGroup,
}: {
  group: EncounterGroup
  onAddEntry: (groupId: string) => void
  onUpdateEntry: (id: string, data: { name?: string; cr?: string; count?: number }) => void
  onDeleteEntry: (id: string) => void
  onUpdateGroup: (id: string, data: { name?: string }) => void
  onDeleteGroup: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const totalXp = group.entries.reduce((s, e) => s + crToXp(e.cr) * e.count, 0)
  const totalCount = group.entries.reduce((s, e) => s + e.count, 0)

  return (
    <div style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderBottom: collapsed ? 'none' : '1px solid var(--border)' }}>
        <button onClick={() => setCollapsed(!collapsed)} style={{ ...tinyBtn, color: 'var(--text-muted)' }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <InlineEdit
          value={group.name}
          onSave={(name) => onUpdateGroup(group.id, { name })}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}
        />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {totalCount} {totalCount === 1 ? 'enemy' : 'enemies'} · {totalXp.toLocaleString()} XP
        </span>
        <button onClick={() => onAddEntry(group.id)} style={iconActionBtn} title="Add enemy">
          <Plus size={13} />
        </button>
        <button onClick={() => onDeleteGroup(group.id)} style={{ ...iconActionBtn, opacity: 0.4 }} title="Delete group">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Entries */}
      {!collapsed && (
        <div>
          {group.entries.length === 0 && (
            <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
              No enemies — click + to add one.
            </div>
          )}
          {group.entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onUpdate={onUpdateEntry}
              onDelete={onDeleteEntry}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Difficulty meter
// ---------------------------------------------------------------------------

function DifficultyMeter({ encounter, partyLevel, partySize }: { encounter: Encounter; partyLevel: number; partySize: number }) {
  const allEntries = encounter.groups.flatMap((g) => g.entries)
  const result = calcDifficulty(allEntries, partyLevel, partySize)
  const color = DIFFICULTY_COLORS[result.difficulty]

  const pct = result.thresholds
    ? Math.min(100, (result.adjustedXp / result.thresholds.deadly) * 100)
    : 0

  const zones = result.thresholds ? [
    { label: 'Easy',   key: 'easy'   as const, pct: (result.thresholds.easy   / result.thresholds.deadly) * 100, color: '#4ade80' },
    { label: 'Medium', key: 'medium' as const, pct: (result.thresholds.medium / result.thresholds.deadly) * 100, color: '#fbbf24' },
    { label: 'Hard',   key: 'hard'   as const, pct: (result.thresholds.hard   / result.thresholds.deadly) * 100, color: '#fb923c' },
  ] : []

  return (
    <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderRadius: '0 0 10px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color, textTransform: 'capitalize' }}>{result.difficulty}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>×{result.multiplier} multiplier</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{result.adjustedXp.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> adj. XP</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>({result.totalXp.toLocaleString()} raw)</span>
        </div>
      </div>

      {/* Bar */}
      <div style={{ position: 'relative', height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'visible' }}>
        {/* Threshold markers */}
        {zones.map((z) => (
          <div key={z.label} style={{
            position: 'absolute',
            left: `${z.pct}%`,
            top: -3,
            width: 2,
            height: 14,
            background: z.color,
            borderRadius: 1,
            opacity: 0.6,
          }} />
        ))}
        {/* Fill */}
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: 'width 0.35s ease, background 0.35s ease',
          minWidth: pct > 0 ? 4 : 0,
        }} />
      </div>

      {/* Threshold labels */}
      {result.thresholds && (
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          {zones.map((z) => (
            <span key={z.label} style={{ fontSize: 11, color: z.color }}>
              {z.label} {result.thresholds![z.key].toLocaleString()}
            </span>
          ))}
          <span style={{ fontSize: 11, color: '#f87171' }}>Deadly {result.thresholds.deadly.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Encounter detail panel
// ---------------------------------------------------------------------------

function EncounterDetail({
  encounterId,
  campaignId,
  onListRefresh,
}: {
  encounterId: string
  campaignId: string
  onListRefresh: () => void
}) {
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [partySize, setPartySize] = useState(4)
  const [partyLevel, setPartyLevel] = useState(1)
  const [savingStatus, setSavingStatus] = useState(false)
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null)

  const reload = async () => {
    const data = await window.api.encounters.get(encounterId, campaignId)
    setEncounter(data)
  }

  useEffect(() => {
    setEncounter(null)
    reload()
  }, [encounterId, campaignId])

  const refresh = async () => {
    await reload()
    onListRefresh()
  }

  const handleUpdateEncounter = async (data: { name?: string; notes?: string; status?: 'draft' | 'ready' | 'complete' }) => {
    await window.api.encounters.update(encounterId, campaignId, data)
    await refresh()
  }

  const handleAddGroup = async () => {
    const name = `Group ${(encounter?.groups.length ?? 0) + 1}`
    await window.api.encounters.createGroup({ encounterId, name, sortOrder: encounter?.groups.length ?? 0 })
    await refresh()
  }

  const handleUpdateGroup = async (id: string, data: { name?: string }) => {
    await window.api.encounters.updateGroup(id, data)
    await refresh()
  }

  const handleDeleteGroup = async (id: string) => {
    await window.api.encounters.deleteGroup(id)
    await refresh()
  }

  const handleAddEntry = (groupId: string) => {
    setAddingToGroup(groupId)
  }

  const handleEnemyChosen = async (choice: { name: string; cr: string }) => {
    if (!addingToGroup) return
    setAddingToGroup(null)
    await window.api.encounters.createEntry({
      groupId: addingToGroup,
      encounterId,
      name: choice.name,
      cr: choice.cr,
      count: 1,
    })
    await refresh()
  }

  const handleUpdateEntry = async (id: string, data: { name?: string; cr?: string; count?: number }) => {
    await window.api.encounters.updateEntry(id, data)
    await refresh()
  }

  const handleDeleteEntry = async (id: string) => {
    await window.api.encounters.deleteEntry(id)
    await refresh()
  }

  const cycleStatus = async () => {
    if (!encounter) return
    setSavingStatus(true)
    const next: Record<string, 'draft' | 'ready' | 'complete'> = { draft: 'ready', ready: 'complete', complete: 'draft' }
    await handleUpdateEncounter({ status: next[encounter.status] })
    setSavingStatus(false)
  }

  if (!encounter) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  const STATUS_LABEL: Record<string, string> = { draft: 'Draft', ready: 'Ready', complete: 'Complete' }
  const STATUS_COLOR: Record<string, string> = { draft: 'var(--text-muted)', ready: '#4ade80', complete: 'var(--accent)' }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <InlineEdit
              value={encounter.name}
              onSave={(name) => handleUpdateEncounter({ name })}
              style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}
            />
            {encounter.description && (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{encounter.description}</p>
            )}
          </div>
          <button
            onClick={cycleStatus}
            disabled={savingStatus}
            style={{
              flexShrink: 0,
              padding: '5px 12px',
              borderRadius: 20,
              border: `1px solid ${STATUS_COLOR[encounter.status]}44`,
              background: `${STATUS_COLOR[encounter.status]}14`,
              color: STATUS_COLOR[encounter.status],
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {STATUS_LABEL[encounter.status]}
          </button>
        </div>

        {/* Party config */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 12 }}>
          <label style={partyLabel}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Party Size</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <button onClick={() => setPartySize(Math.max(1, partySize - 1))} style={countBtn}>−</button>
              <span style={{ minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{partySize}</span>
              <button onClick={() => setPartySize(Math.min(10, partySize + 1))} style={countBtn}>+</button>
            </div>
          </label>
          <label style={partyLabel}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Party Level</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <button onClick={() => setPartyLevel(Math.max(1, partyLevel - 1))} style={countBtn}>−</button>
              <span style={{ minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{partyLevel}</span>
              <button onClick={() => setPartyLevel(Math.min(20, partyLevel + 1))} style={countBtn}>+</button>
            </div>
          </label>
        </div>
      </div>

      {/* Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {encounter.groups.map((group) => (
          <GroupPanel
            key={group.id}
            group={group}
            onAddEntry={handleAddEntry}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        ))}
        <button onClick={handleAddGroup} style={addGroupBtn}>
          <Plus size={14} />
          Add Group
        </button>
      </div>

      {/* Difficulty meter */}
      <DifficultyMeter encounter={encounter} partyLevel={partyLevel} partySize={partySize} />

      {addingToGroup && (
        <AddEnemyModal
          campaignId={campaignId}
          onAdd={handleEnemyChosen}
          onClose={() => setAddingToGroup(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New encounter modal
// ---------------------------------------------------------------------------

function NewEncounterModal({ onSave, onClose }: { onSave: (name: string, description: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>New Encounter</h3>
        <label style={fieldLabel}>Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSave(name.trim(), description) }}
          placeholder="Goblin ambush..."
          style={textInput}
        />
        <label style={{ ...fieldLabel, marginTop: 12 }}>Description (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Party encounters goblins on the road..."
          style={textInput}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave(name.trim(), description)}
            style={{ ...cancelBtn, background: 'var(--accent)', color: '#fff', opacity: name.trim() ? 1 : 0.4 }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function EncounterCreator() {
  const { activeCampaign } = useAppStore()
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [mounted, setMounted] = useState(false)

  const load = async () => {
    if (!activeCampaign) return
    const list = await window.api.encounters.list(activeCampaign.id)
    setEncounters(list)
  }

  useEffect(() => {
    setMounted(true)
    load()
  }, [activeCampaign])

  const handleCreate = async (name: string, description: string) => {
    if (!activeCampaign) return
    setShowNew(false)
    const enc = await window.api.encounters.create({ campaignId: activeCampaign.id, name, description: description || undefined })
    await load()
    setSelectedId(enc.id)
  }

  const handleDelete = async (id: string) => {
    if (!activeCampaign) return
    if (!confirm('Delete this encounter?')) return
    await window.api.encounters.delete(id, activeCampaign.id)
    if (selectedId === id) setSelectedId(null)
    await load()
  }

  const handleListRefresh = async () => {
    await load()
  }

  if (!activeCampaign) return null

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary)',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.2s',
    }}>
      {/* Top bar */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Swords size={20} style={{ color: '#f87171' }} />
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Encounters</h1>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>· {activeCampaign.name}</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <EncounterList
          encounters={encounters}
          selected={selectedId}
          onSelect={setSelectedId}
          onCreate={() => setShowNew(true)}
          onDelete={handleDelete}
        />

        {selectedId ? (
          <EncounterDetail key={selectedId} encounterId={selectedId} campaignId={activeCampaign.id} onListRefresh={handleListRefresh} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
            <Swords size={40} style={{ opacity: 0.2 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Select or create an encounter</p>
          </div>
        )}
      </div>

      {showNew && <NewEncounterModal onSave={handleCreate} onClose={() => setShowNew(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const iconActionBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 4,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s, background 0.15s',
}

const tinyBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const countBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'var(--bg-hover)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
}

const crSelect: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  color: 'var(--text-secondary)',
  fontSize: 12,
  padding: '3px 6px',
  cursor: 'pointer',
}

const addGroupBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  width: '100%',
  padding: '10px 12px',
  background: 'transparent',
  border: '1px dashed var(--border)',
  borderRadius: 8,
  color: 'var(--text-muted)',
  fontSize: 13,
  cursor: 'pointer',
  justifyContent: 'center',
  transition: 'border-color 0.15s, color 0.15s',
}

const partyLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
}

const modalBox: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-light)',
  borderRadius: 12,
  padding: 24,
  width: 420,
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

const textInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 14,
  boxSizing: 'border-box',
}

const cancelBtn: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 13,
  cursor: 'pointer',
}
