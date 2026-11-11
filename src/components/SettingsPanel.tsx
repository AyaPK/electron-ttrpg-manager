import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from './ui/Button'

export function SettingsPanel() {
  const [theme, setTheme] = useState('dark')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.settings.get('theme').then((v) => { if (v) setTheme(v) })
  }, [])

  const handleSave = async () => {
    await window.api.settings.set('theme', theme)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Settings</h2>
      </div>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h3 style={sectionTitle}>Appearance</h3>
          <div style={row}>
            <div>
              <div style={rowLabel}>Theme</div>
              <div style={rowDesc}>Choose the application colour scheme.</div>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light (coming soon)</option>
            </select>
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitle}>About</h3>
          <div style={infoCard}>
            <div style={infoRow}>
              <span style={infoLabel}>Version</span>
              <span style={infoValue}>1.0.0</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>Stack</span>
              <span style={infoValue}>Electron · React · SQLite · Drizzle · TipTap</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>Data location</span>
              <span style={infoValue}>%APPDATA%/campaign-manager</span>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <Button onClick={handleSave} icon={<Save size={14} />}>
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>
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
  padding: '24px 32px 20px',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '28px 32px',
  maxWidth: 640,
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: 0,
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 16px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 8,
}

const rowLabel: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--text-primary)',
  marginBottom: 2,
}

const rowDesc: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
}

const infoCard: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  overflow: 'hidden',
}

const infoRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  borderBottom: '1px solid var(--border)',
  gap: 16,
}

const infoLabel: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-muted)',
  flexShrink: 0,
}

const infoValue: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  textAlign: 'right',
}
