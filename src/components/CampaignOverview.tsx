import { useEffect, useState } from 'react'
import { Users, MapPin, Shield, Package, Plus, Edit2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { EntityCounts, EntityType } from '../types/electron.d'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'

const STAT_CARDS: { type: EntityType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'npc', label: 'NPCs', icon: <Users size={20} />, color: 'var(--npc-color)' },
  { type: 'location', label: 'Locations', icon: <MapPin size={20} />, color: 'var(--location-color)' },
  { type: 'faction', label: 'Factions', icon: <Shield size={20} />, color: 'var(--faction-color)' },
  { type: 'item', label: 'Items', icon: <Package size={20} />, color: 'var(--item-color)' },
]

export function CampaignOverview() {
  const { activeCampaign, setActiveCampaign, navigateToEntityList } = useAppStore()
  const [counts, setCounts] = useState<EntityCounts>({ npc: 0, location: 0, faction: 0, item: 0, total: 0 })
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', system: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activeCampaign) return
    window.api.entities.counts(activeCampaign.id).then(setCounts)
  }, [activeCampaign])

  const openEdit = () => {
    if (!activeCampaign) return
    setForm({ name: activeCampaign.name, description: activeCampaign.description, system: activeCampaign.system })
    setShowEdit(true)
  }

  const handleSave = async () => {
    if (!activeCampaign || !form.name.trim()) return
    setSaving(true)
    const updated = await window.api.campaigns.update(activeCampaign.id, form)
    if (updated) setActiveCampaign(updated)
    setSaving(false)
    setShowEdit(false)
  }

  if (!activeCampaign) return null

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {activeCampaign.name}
            </h1>
            <button onClick={openEdit} style={editBtn} title="Edit campaign">
              <Edit2 size={15} />
            </button>
          </div>
          {activeCampaign.system && (
            <span style={systemBadge}>{activeCampaign.system}</span>
          )}
          {activeCampaign.description && (
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6, maxWidth: 600 }}>
              {activeCampaign.description}
            </p>
          )}
        </div>
        <Button onClick={() => navigateToEntityList(null)} icon={<Plus size={15} />}>
          New Entity
        </Button>
      </div>

      <div style={statsGrid}>
        {STAT_CARDS.map(({ type, label, icon, color }) => (
          <StatCard
            key={type}
            label={label}
            icon={icon}
            color={color}
            count={counts[type]}
            onClick={() => navigateToEntityList(type)}
          />
        ))}
      </div>

      <div style={totalRow}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {counts.total} total {counts.total === 1 ? 'entity' : 'entities'} in this campaign
        </span>
      </div>

      {showEdit && (
        <Modal title="Edit Campaign" onClose={() => setShowEdit(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoFocus />
            <Input label="RPG System" value={form.system} onChange={(v) => setForm({ ...form, system: v })} placeholder="e.g. D&D 5e" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatCard({ label, icon, color, count, onClick }: { label: string; icon: React.ReactNode; color: string; count: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-secondary)',
        border: `1px solid ${hovered ? color + '40' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
      </div>
    </button>
  )
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '36px 40px',
  height: '100%',
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 32,
  gap: 16,
}

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 16,
  marginBottom: 16,
}

const totalRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  paddingTop: 8,
}

const editBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 5,
  borderRadius: 5,
  display: 'flex',
  alignItems: 'center',
}

const systemBadge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12,
  padding: '3px 10px',
  background: 'var(--accent-dim)',
  color: 'var(--accent)',
  borderRadius: 20,
  fontWeight: 500,
}
