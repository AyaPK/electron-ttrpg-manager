import { useEffect, useState } from 'react'
import { Plus, BookOpen, Trash2, Edit2, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Campaign } from '../types/electron.d'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export function CampaignSelect() {
  const { setActiveCampaign } = useAppStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Campaign | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const [form, setForm] = useState({ name: '', description: '', system: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const list = await window.api.campaigns.list()
    setCampaigns(list.reverse())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ name: '', description: '', system: '' })
    setShowCreate(true)
  }

  const openEdit = (c: Campaign) => {
    setForm({ name: c.name, description: c.description ?? '', system: c.system ?? '' })
    setEditTarget(c)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editTarget) {
      await window.api.campaigns.update(editTarget.id, form)
      setEditTarget(null)
    } else {
      await window.api.campaigns.create(form)
      setShowCreate(false)
    }
    setSaving(false)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.api.campaigns.delete(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={logoStyle}><BookOpen size={28} color="var(--accent)" /></div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Campaign Manager</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Your worlds, your stories.</p>
          </div>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>New Campaign</Button>
      </div>

      {loading ? (
        <div style={emptyStyle}><span style={{ color: 'var(--text-muted)' }}>Loading...</span></div>
      ) : campaigns.length === 0 ? (
        <div style={emptyStyle}>
          <BookOpen size={48} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: 15 }}>No campaigns yet.</p>
          <Button onClick={openCreate} icon={<Plus size={15} />} style={{ marginTop: 12 }}>Create your first campaign</Button>
        </div>
      ) : (
        <div style={gridStyle}>
          {campaigns.map((c) => (
            <div key={c.id} style={cardStyle} onClick={() => setActiveCampaign(c)}>
              <div style={cardBody}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{c.name}</h3>
                    {c.system && <span style={badgeStyle}>{c.system}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <IconBtn onClick={() => openEdit(c)} title="Edit"><Edit2 size={14} /></IconBtn>
                    <IconBtn onClick={() => setDeleteTarget(c)} title="Delete" danger><Trash2 size={14} /></IconBtn>
                  </div>
                </div>
                {c.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description}
                  </p>
                )}
              </div>
              <div style={cardFooter}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Updated {new Date(c.updatedAt).toLocaleDateString()}
                </span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editTarget) && (
        <Modal title={editTarget ? 'Edit Campaign' : 'New Campaign'} onClose={() => { setShowCreate(false); setEditTarget(null) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Campaign name" autoFocus />
            <Input label="RPG System" value={form.system} onChange={(v) => setForm({ ...form, system: v })} placeholder="e.g. D&D 5e, Pathfinder..." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="A brief description of your campaign..."
                style={{ resize: 'vertical', width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="ghost" onClick={() => { setShowCreate(false); setEditTarget(null) }}>Cancel</Button>
              <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
                {editTarget ? 'Save Changes' : 'Create Campaign'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Campaign" onClose={() => setDeleteTarget(null)}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>? This will permanently remove all entities and relationships.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Campaign</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? (danger ? 'rgba(248,113,113,0.1)' : 'var(--bg-hover)') : 'transparent',
        border: 'none',
        color: hovered ? (danger ? 'var(--danger)' : 'var(--text-primary)') : 'var(--text-muted)',
        padding: 5,
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
    >
      {children}
    </button>
  )
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '40px 48px',
  maxWidth: 900,
  margin: '0 auto',
  width: '100%',
  overflowY: 'auto',
  height: '100vh',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 32,
}

const logoStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 12,
  background: 'var(--accent-dim)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const emptyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  transition: 'border-color 0.15s',
  overflow: 'hidden',
}

const cardBody: React.CSSProperties = {
  padding: '16px 16px 12px',
  flex: 1,
}

const cardFooter: React.CSSProperties = {
  padding: '10px 16px',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  padding: '2px 8px',
  background: 'var(--accent-dim)',
  color: 'var(--accent)',
  borderRadius: 20,
  fontWeight: 500,
}
