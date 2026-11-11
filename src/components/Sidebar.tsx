import { useState } from 'react'
import {
  BookOpen, Users, MapPin, Shield, Package,
  Settings, ChevronLeft, ChevronRight, Plus, LogOut
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { EntityType } from '../types/electron.d'

const ENTITY_TYPES: { type: EntityType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'npc', label: 'NPCs', icon: <Users size={16} />, color: 'var(--npc-color)' },
  { type: 'location', label: 'Locations', icon: <MapPin size={16} />, color: 'var(--location-color)' },
  { type: 'faction', label: 'Factions', icon: <Shield size={16} />, color: 'var(--faction-color)' },
  { type: 'item', label: 'Items', icon: <Package size={16} />, color: 'var(--item-color)' },
]

export function Sidebar() {
  const {
    activeCampaign,
    view,
    entityTypeFilter,
    sidebarOpen,
    toggleSidebar,
    navigateToCampaignOverview,
    navigateToEntityList,
    navigateToCampaignSelect,
    setView,
  } = useAppStore()

  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const isActive = (v: string, type?: EntityType | null) => {
    if (v === 'entity-list' && type) return view === 'entity-list' && entityTypeFilter === type
    if (v === 'entity-list' && !type) return view === 'entity-list' && !entityTypeFilter
    return view === v
  }

  if (!sidebarOpen) {
    return (
      <div style={collapsedStyle}>
        <button onClick={toggleSidebar} style={collapseBtn} title="Expand sidebar">
          <ChevronRight size={16} />
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 8 }}>
          <button style={iconBtn(isActive('campaign-overview'))} onClick={navigateToCampaignOverview} title="Overview">
            <BookOpen size={18} />
          </button>
          {ENTITY_TYPES.map(({ type, icon, color }) => (
            <button key={type} style={{ ...iconBtn(isActive('entity-list', type)), color }} onClick={() => navigateToEntityList(type)} title={type}>
              {icon}
            </button>
          ))}
        </div>
        <button style={iconBtn(view === 'settings')} onClick={() => setView('settings')} title="Settings">
          <Settings size={18} />
        </button>
      </div>
    )
  }

  return (
    <div style={sidebarStyle}>
      <div style={sidebarHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Campaign</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeCampaign?.name ?? '—'}
          </span>
        </div>
        <button onClick={toggleSidebar} style={collapseBtn} title="Collapse sidebar">
          <ChevronLeft size={16} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem
          label="Overview"
          icon={<BookOpen size={15} />}
          active={isActive('campaign-overview')}
          hovered={hoveredItem === 'overview'}
          onHover={(h) => setHoveredItem(h ? 'overview' : null)}
          onClick={navigateToCampaignOverview}
        />

        <div style={{ margin: '12px 0 4px 8px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          World Bible
        </div>

        {ENTITY_TYPES.map(({ type, label, icon, color }) => (
          <NavItem
            key={type}
            label={label}
            icon={<span style={{ color }}>{icon}</span>}
            active={isActive('entity-list', type)}
            hovered={hoveredItem === type}
            onHover={(h) => setHoveredItem(h ? type : null)}
            onClick={() => navigateToEntityList(type)}
          />
        ))}

        <NavItem
          label="All Entities"
          icon={<Plus size={15} />}
          active={isActive('entity-list', null) && view === 'entity-list'}
          hovered={hoveredItem === 'all'}
          onHover={(h) => setHoveredItem(h ? 'all' : null)}
          onClick={() => navigateToEntityList(null)}
          subtle
        />
      </nav>

      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem
          label="Settings"
          icon={<Settings size={15} />}
          active={view === 'settings'}
          hovered={hoveredItem === 'settings'}
          onHover={(h) => setHoveredItem(h ? 'settings' : null)}
          onClick={() => setView('settings')}
        />
        <NavItem
          label="Switch Campaign"
          icon={<LogOut size={15} />}
          active={false}
          hovered={hoveredItem === 'switch'}
          onHover={(h) => setHoveredItem(h ? 'switch' : null)}
          onClick={navigateToCampaignSelect}
          subtle
        />
      </div>
    </div>
  )
}

function NavItem({ label, icon, active, hovered, onHover, onClick, subtle }: {
  label: string
  icon: React.ReactNode
  active: boolean
  hovered: boolean
  onHover: (h: boolean) => void
  onClick: () => void
  subtle?: boolean
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 10px',
        borderRadius: 6,
        border: 'none',
        background: active ? 'var(--bg-active)' : hovered ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--accent)' : subtle ? 'var(--text-muted)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
        fontSize: 13,
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.1s, color 0.1s',
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const sidebarStyle: React.CSSProperties = {
  width: 220,
  minWidth: 220,
  height: '100vh',
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
}

const collapsedStyle: React.CSSProperties = {
  width: 52,
  minWidth: 52,
  height: '100vh',
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 0 12px',
  flexShrink: 0,
}

const sidebarHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 12px 10px',
  borderBottom: '1px solid var(--border)',
  gap: 8,
}

const collapseBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  padding: 4,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  flexShrink: 0,
}

const iconBtn = (active: boolean): React.CSSProperties => ({
  background: active ? 'var(--bg-active)' : 'transparent',
  border: 'none',
  color: active ? 'var(--accent)' : 'var(--text-muted)',
  padding: 8,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  width: 36,
  height: 36,
  justifyContent: 'center',
})
