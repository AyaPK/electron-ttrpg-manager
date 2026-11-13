import { useEffect, useState } from 'react'
import { Camera, Edit2, Settings, LogOut, Sword } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { Entity } from '../types/electron.d'

// ---------------------------------------------------------------------------
// CampaignDashboard — the homepage when a campaign is active
// ---------------------------------------------------------------------------

export function CampaignDashboard() {
  const {
    activeCampaign,
    setActiveCampaign,
    navigateToEntityList,
    navigateToCampaignSelect,
    setView,
  } = useAppStore()

  const [players, setPlayers] = useState<Entity[]>([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', system: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activeCampaign) return
    window.api.entities.list(activeCampaign.id, { type: 'player' }).then(setPlayers)
  }, [activeCampaign])

  if (!activeCampaign) return null

  const bgPath = activeCampaign.backgroundImage
  const bgUrl = bgPath ? `campaign-media://local/${encodeURIComponent(bgPath)}` : null

  const handlePickBackground = async () => {
    const path = await window.api.campaigns.pickImage()
    if (!path) return
    const updated = await window.api.campaigns.update(activeCampaign.id, { backgroundImage: path })
    setActiveCampaign(updated)
  }

  const handleRemoveBackground = async () => {
    const updated = await window.api.campaigns.update(activeCampaign.id, { backgroundImage: null })
    setActiveCampaign(updated)
  }

  const openEdit = () => {
    setEditForm({ name: activeCampaign.name, description: activeCampaign.description ?? '', system: activeCampaign.system ?? '' })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const updated = await window.api.campaigns.update(activeCampaign.id, {
      name: editForm.name,
      description: editForm.description || undefined,
      system: editForm.system || undefined,
    })
    setActiveCampaign(updated)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div style={pageStyle}>
      {/* ── Hero section ─────────────────────────────────────────────── */}
      <div style={{ ...heroStyle, backgroundImage: bgUrl ? `url("${bgUrl}")` : undefined }}>
        {/* Overlay */}
        <div style={heroOverlay} />

        {/* Background controls */}
        <div style={bgControls}>
          <button onClick={handlePickBackground} style={bgBtn} title="Change background image">
            <Camera size={14} />
            {bgUrl ? 'Change image' : 'Set background'}
          </button>
          {bgUrl && (
            <button onClick={handleRemoveBackground} style={{ ...bgBtn, opacity: 0.6 }} title="Remove background">
              Remove
            </button>
          )}
        </div>

        {/* Campaign title */}
        <div style={heroContent}>
          {activeCampaign.system && (
            <span style={systemPill}>{activeCampaign.system}</span>
          )}
          <h1 style={heroTitle}>{activeCampaign.name}</h1>
          {activeCampaign.description && (
            <p style={heroDesc}>{activeCampaign.description}</p>
          )}
          <button onClick={openEdit} style={editBtn}>
            <Edit2 size={13} /> Edit details
          </button>
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────── */}
      <div style={contentArea}>

        {/* Players */}
        <section style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Party</h2>
            <button onClick={() => navigateToEntityList('player')} style={viewAllBtn}>
              View all →
            </button>
          </div>
          {players.length === 0 ? (
            <div style={emptyParty}>
              <Sword size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No players added yet</p>
              <button onClick={() => navigateToEntityList('player')} style={{ ...viewAllBtn, marginTop: 10 }}>
                Add players →
              </button>
            </div>
          ) : (
            <div style={playerGrid}>
              {players.map((p) => {
                const meta = p.metadata as Record<string, string>
                return (
                  <div key={p.id} style={playerCard}>
                    <div style={playerAvatar}>
                      <Sword size={20} style={{ color: 'var(--player-color)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {[meta.playerClass, meta.race, meta.level ? `Lvl ${meta.level}` : null].filter(Boolean).join(' · ')}
                      </div>
                      {meta.player && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>played by {meta.player}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Footer bar ───────────────────────────────────────────────── */}
      <div style={footerBar}>
        <button onClick={() => setView('settings')} style={footerBtn}>
          <Settings size={14} /> Settings
        </button>
        <button onClick={navigateToCampaignSelect} style={footerBtn}>
          <LogOut size={14} /> Switch Campaign
        </button>
      </div>

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      {editing && (
        <div style={modalOverlay} onClick={() => setEditing(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Campaign</h3>

            <label style={fieldLabel}>Campaign Name</label>
            <input
              autoFocus
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              style={textInput}
            />

            <label style={{ ...fieldLabel, marginTop: 14 }}>System</label>
            <input
              value={editForm.system}
              onChange={(e) => setEditForm((f) => ({ ...f, system: e.target.value }))}
              placeholder="D&D 5e, Pathfinder, Call of Cthulhu…"
              style={textInput}
            />

            <label style={{ ...fieldLabel, marginTop: 14 }}>Description</label>
            <textarea
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="A short summary of this campaign…"
              style={{ ...textInput, resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setEditing(false)} style={cancelBtn}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={!editForm.name.trim() || saving}
                style={{ ...cancelBtn, background: 'var(--accent)', color: '#fff', opacity: editForm.name.trim() ? 1 : 0.4 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pageStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  background: 'var(--bg-primary)',
}

const heroStyle: React.CSSProperties = {
  position: 'relative',
  flexShrink: 0,
  height: 260,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundColor: 'var(--bg-secondary)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
}

const heroOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)',
  pointerEvents: 'none',
}

const bgControls: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 16,
  display: 'flex',
  gap: 6,
  zIndex: 10,
}

const bgBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 7,
  color: 'rgba(255,255,255,0.85)',
  fontSize: 12,
  fontWeight: 500,
  padding: '5px 10px',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
}

const heroContent: React.CSSProperties = {
  position: 'relative',
  zIndex: 5,
  padding: '20px 28px',
}

const systemPill: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--accent)',
  background: 'rgba(124,106,247,0.2)',
  border: '1px solid rgba(124,106,247,0.3)',
  borderRadius: 20,
  padding: '2px 10px',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const heroTitle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: '#fff',
  margin: '0 0 6px',
  lineHeight: 1.1,
  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
}

const heroDesc: React.CSSProperties = {
  fontSize: 14,
  color: 'rgba(255,255,255,0.75)',
  margin: '0 0 12px',
  lineHeight: 1.5,
  maxWidth: 560,
  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
}

const editBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 7,
  color: 'rgba(255,255,255,0.8)',
  fontSize: 12,
  fontWeight: 500,
  padding: '5px 12px',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
}

const contentArea: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
}

const section: React.CSSProperties = {}

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 14,
}


const playerGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 10,
}

const playerCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 10,
}

const playerAvatar: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'var(--player-color)18',
  border: '1px solid var(--player-color)40',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const emptyParty: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '32px 20px',
  background: 'var(--bg-secondary)',
  border: '1px dashed var(--border)',
  borderRadius: 10,
}

const footerBar: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '10px 20px',
  borderTop: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
}

const footerBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 13,
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: 7,
  cursor: 'pointer',
}

const viewAllBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--accent)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  padding: '4px 8px',
}

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(2px)',
}

const modalBox: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-light)',
  borderRadius: 12,
  padding: '24px 28px',
  width: 460,
  maxWidth: '90vw',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: 6,
}

const textInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  color: 'var(--text-primary)',
  fontSize: 14,
  boxSizing: 'border-box',
}

const cancelBtn: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}
