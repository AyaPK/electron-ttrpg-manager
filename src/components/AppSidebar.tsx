import { useState } from 'react'
import { BookOpen, Home } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { AppSection } from '../store/useAppStore'

interface SectionDef {
  id: AppSection
  label: string
  icon: React.ReactNode
  color: string
}

const SECTIONS: SectionDef[] = [
  {
    id: 'world-bible',
    label: 'World Bible',
    icon: <BookOpen size={18} />,
    color: 'var(--accent)',
  },
]

export function AppSidebar() {
  const { appSection, activeCampaign, navigateToCampaignOverview, navigateToWorldBible } = useAppStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  if (!activeCampaign) return null

  return (
    <div style={sidebarStyle}>
      {/* Campaign home button */}
      <button
        title="Campaign Home"
        onClick={navigateToCampaignOverview}
        onMouseEnter={() => setHoveredItem('home')}
        onMouseLeave={() => setHoveredItem(null)}
        style={iconBtnStyle(appSection === null, hoveredItem === 'home')}
      >
        <Home size={18} />
      </button>

      <div style={dividerStyle} />

      {/* Feature sections */}
      {SECTIONS.map((section) => {
        const active = appSection === section.id
        const hovered = hoveredItem === section.id
        return (
          <button
            key={section.id}
            title={section.label}
            onClick={navigateToWorldBible}
            onMouseEnter={() => setHoveredItem(section.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              ...iconBtnStyle(active, hovered),
              color: active ? section.color : hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
            }}
          >
            {section.icon}
            {active && <ActivePip color={section.color} />}
          </button>
        )
      })}

      <Tooltip label={hoveredItem === 'home' ? 'Home' : SECTIONS.find(s => s.id === hoveredItem)?.label ?? null} />
    </div>
  )
}

function ActivePip({ color }: { color: string }) {
  return (
    <span style={{
      position: 'absolute',
      left: 2,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 3,
      height: 20,
      borderRadius: '0 2px 2px 0',
      background: color,
    }} />
  )
}

function Tooltip({ label }: { label: string | null }) {
  if (!label) return null
  return (
    <div style={{
      position: 'fixed',
      left: 56,
      pointerEvents: 'none',
      background: 'var(--bg-hover)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '5px 10px',
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap',
      zIndex: 100,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      {label}
    </div>
  )
}

const iconBtnStyle = (active: boolean, hovered: boolean): React.CSSProperties => ({
  position: 'relative',
  width: 44,
  height: 44,
  borderRadius: 10,
  border: 'none',
  background: active ? 'var(--bg-active)' : hovered ? 'var(--bg-hover)' : 'transparent',
  color: active ? 'var(--accent)' : hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  flexShrink: 0,
})

const sidebarStyle: React.CSSProperties = {
  width: 56,
  minWidth: 56,
  height: '100vh',
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '12px 0',
  gap: 4,
  flexShrink: 0,
}

const dividerStyle: React.CSSProperties = {
  width: 28,
  height: 1,
  background: 'var(--border)',
  margin: '4px 0',
  flexShrink: 0,
}
