import { useEffect, useState } from 'react'
import { Plus, BookOpen, Trash2, Edit2, ChevronRight, AlertCircle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Campaign } from '../types/electron.d'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

type DialogMode = { kind: 'create' } | { kind: 'edit'; campaign: Campaign } | { kind: 'delete'; campaign: Campaign } | null

const EMPTY_FORM = { name: '', description: '', system: '' }

export function CampaignSelect() {
  const { setActiveCampaign } = useAppStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await window.api.campaigns.list()
      setCampaigns([...list].sort((a, b) => b.updatedAt - a.updatedAt))
    } catch (e) {
      setError('Failed to load campaigns. Please restart the application.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setSaveError(null)
    setDialog({ kind: 'create' })
  }

  const openEdit = (e: React.MouseEvent, c: Campaign) => {
    e.stopPropagation()
    setForm({ name: c.name, description: c.description ?? '', system: c.system ?? '' })
    setSaveError(null)
    setDialog({ kind: 'edit', campaign: c })
  }

  const openDelete = (e: React.MouseEvent, c: Campaign) => {
    e.stopPropagation()
    setDialog({ kind: 'delete', campaign: c })
  }

  const closeDialog = () => setDialog(null)

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      if (dialog?.kind === 'edit') {
        const updated = await window.api.campaigns.update(dialog.campaign.id, form)
        setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        const created = await window.api.campaigns.create(form)
        setCampaigns((prev) => [created, ...prev])
      }
      closeDialog()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (dialog?.kind !== 'delete') return
    setSaving(true)
    try {
      await window.api.campaigns.delete(dialog.campaign.id)
      setCampaigns((prev) => prev.filter((c) => c.id !== dialog.campaign.id))
      closeDialog()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Delete failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving && form.name.trim()) handleSave()
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={logoStyle}>
            <BookOpen size={26} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Campaign Manager
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Your worlds, your stories.</p>
          </div>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>New Campaign</Button>
      </div>

      {error && (
        <div style={errorBannerStyle}>
          <AlertCircle size={15} />
          <span>{error}</span>
          <button onClick={load} style={retryBtnStyle}>Retry</button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : !error && campaigns.length === 0 ? (
        <EmptyState onCreateClick={openCreate} />
      ) : (
        <div style={gridStyle}>
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              hovered={hoveredCard === c.id}
              onMouseEnter={() => setHoveredCard(c.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setActiveCampaign(c)}
              onEdit={(e) => openEdit(e, c)}
              onDelete={(e) => openDelete(e, c)}
            />
          ))}
        </div>
      )}

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <Modal
          title={dialog.kind === 'edit' ? 'Edit Campaign' : 'New Campaign'}
          onClose={closeDialog}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onKeyDown={handleKeyDown}>
            <Input
              label="Name *"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Campaign name"
              autoFocus
            />
            <Input
              label="RPG System"
              value={form.system}
              onChange={(v) => setForm((f) => ({ ...f, system: v }))}
              placeholder="e.g. D&D 5e, Pathfinder, Call of Cthulhu…"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="A brief description of your campaign…"
                style={{ resize: 'vertical', width: '100%' }}
              />
            </div>
            {saveError && (
              <div style={inlineErrorStyle}>
                <AlertCircle size={13} />
                <span>{saveError}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="ghost" onClick={closeDialog} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
                {dialog.kind === 'edit' ? 'Save Changes' : 'Create Campaign'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {dialog?.kind === 'delete' && (
        <Modal title="Delete Campaign" onClose={closeDialog} width={440}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{dialog.campaign.name}</strong>?
            {' '}This will permanently remove all entities and relationships.
          </p>
          {saveError && (
            <div style={{ ...inlineErrorStyle, marginBottom: 16 }}>
              <AlertCircle size={13} />
              <span>{saveError}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={closeDialog} disabled={saving}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={saving}>Delete Campaign</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function CampaignCard({
  campaign: c,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onEdit,
  onDelete,
}: {
  campaign: Campaign
  hovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderColor: hovered ? 'var(--accent)' : 'var(--border)',
        boxShadow: hovered ? '0 0 0 1px var(--accent)' : 'none',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div style={cardBody}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.name}
            </h3>
            {c.system && <span style={badgeStyle}>{c.system}</span>}
          </div>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <IconBtn onClick={onEdit} title="Edit campaign"><Edit2 size={13} /></IconBtn>
            <IconBtn onClick={onDelete} title="Delete campaign" danger><Trash2 size={13} /></IconBtn>
          </div>
        </div>
        {c.description ? (
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 13,
            marginTop: 10,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {c.description}
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10, fontStyle: 'italic' }}>
            No description
          </p>
        )}
      </div>
      <div style={cardFooter}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Updated {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <ChevronRight size={14} color={hovered ? 'var(--accent)' : 'var(--text-muted)'} style={{ transition: 'color 0.15s' }} />
      </div>
    </div>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div style={emptyStyle}>
      <div style={emptyIconWrap}>
        <BookOpen size={32} color="var(--accent)" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
        No campaigns yet
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, textAlign: 'center', maxWidth: 320 }}>
        Create your first campaign to start building worlds, characters, and stories.
      </p>
      <Button onClick={onCreateClick} icon={<Plus size={15} />}>Create your first campaign</Button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={gridStyle}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...cardStyle, borderColor: 'var(--border)', cursor: 'default', opacity: 0.5 }}>
          <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={skeletonLine(140, 16)} />
            <div style={skeletonLine(72, 20)} />
            <div style={{ ...skeletonLine('100%', 12), marginTop: 4 }} />
            <div style={skeletonLine('80%', 12)} />
            <div style={skeletonLine('60%', 12)} />
          </div>
          <div style={cardFooter}>
            <div style={skeletonLine(100, 12)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  title?: string
  danger?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? (danger ? 'rgba(248,113,113,0.12)' : 'var(--bg-hover)') : 'transparent',
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

function skeletonLine(width: number | string, height: number): React.CSSProperties {
  return {
    width,
    height,
    borderRadius: 4,
    background: 'var(--bg-hover)',
    animation: 'pulse 1.4s ease-in-out infinite',
  }
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '40px 48px',
  maxWidth: 960,
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
  width: 50,
  height: 50,
  borderRadius: 12,
  background: 'var(--accent-dim)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const emptyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBottom: 60,
}

const emptyIconWrap: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 20,
  background: 'var(--accent-dim)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
  gap: 16,
  alignContent: 'start',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  transition: 'border-color 0.15s, box-shadow 0.15s',
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

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  background: 'rgba(248,113,113,0.1)',
  border: '1px solid rgba(248,113,113,0.25)',
  borderRadius: 8,
  color: 'var(--danger)',
  fontSize: 13,
  marginBottom: 24,
}

const retryBtnStyle: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'transparent',
  border: '1px solid var(--danger)',
  color: 'var(--danger)',
  padding: '3px 10px',
  borderRadius: 5,
  fontSize: 12,
  cursor: 'pointer',
}

const inlineErrorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: 'var(--danger)',
  fontSize: 13,
  padding: '8px 10px',
  background: 'rgba(248,113,113,0.08)',
  borderRadius: 6,
}
