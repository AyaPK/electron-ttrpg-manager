import { useEffect, useState } from 'react'
import { Users, MapPin, Shield, Package, BookOpen, Settings, LogOut, ChevronRight, Skull, Sword, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { EntityCounts, EntityType } from '../types/electron.d'

// ---------------------------------------------------------------------------
// Node definitions
// ---------------------------------------------------------------------------

interface OrbitalNodeDef {
  id: string
  label: string
  sublabel?: string
  icon: React.ReactNode
  color: string
  action: () => void
  entityType?: EntityType
}

// Uniform orbital radius in px
const ORBIT_RADIUS = 210
// 9 nodes, start at top (-90°), evenly spaced at 40° each
const ANGLES = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ((i * 40 - 90) * Math.PI) / 180)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignHub() {
  const {
    activeCampaign,
    navigateToEntityList,
    navigateToCampaignSelect,
    setView,
  } = useAppStore()

  const [counts, setCounts] = useState<EntityCounts>({ npc: 0, location: 0, faction: 0, item: 0, monster: 0, player: 0, spell: 0, total: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (activeCampaign) {
      window.api.entities.counts(activeCampaign.id).then(setCounts)
    }
  }, [activeCampaign])

  if (!activeCampaign) return null

  const orbitalNodes: OrbitalNodeDef[] = [
    {
      id: 'npc',
      label: 'NPCs',
      sublabel: `${counts.npc}`,
      icon: <Users size={20} />,
      color: 'var(--npc-color)',
      action: () => navigateToEntityList('npc'),
      entityType: 'npc',
    },
    {
      id: 'monster',
      label: 'Monsters',
      sublabel: `${counts.monster}`,
      icon: <Skull size={20} />,
      color: 'var(--monster-color)',
      action: () => navigateToEntityList('monster'),
      entityType: 'monster',
    },
    {
      id: 'location',
      label: 'Places',
      sublabel: `${counts.location}`,
      icon: <MapPin size={20} />,
      color: 'var(--location-color)',
      action: () => navigateToEntityList('location'),
      entityType: 'location',
    },
    {
      id: 'player',
      label: 'Players',
      sublabel: `${counts.player}`,
      icon: <Sword size={20} />,
      color: 'var(--player-color)',
      action: () => navigateToEntityList('player'),
      entityType: 'player',
    },
    {
      id: 'item',
      label: 'Items',
      sublabel: `${counts.item}`,
      icon: <Package size={20} />,
      color: 'var(--item-color)',
      action: () => navigateToEntityList('item'),
      entityType: 'item',
    },
    {
      id: 'faction',
      label: 'Factions',
      sublabel: `${counts.faction}`,
      icon: <Shield size={20} />,
      color: 'var(--faction-color)',
      action: () => navigateToEntityList('faction'),
      entityType: 'faction',
    },
    {
      id: 'journal',
      label: 'Journal',
      sublabel: undefined,
      icon: <BookOpen size={20} />,
      color: 'var(--accent)',
      action: () => navigateToEntityList(null),
    },
    {
      id: 'spell',
      label: 'Spells',
      sublabel: `${counts.spell}`,
      icon: <Sparkles size={20} />,
      color: 'var(--spell-color)',
      action: () => navigateToEntityList('spell'),
      entityType: 'spell',
    },
    {
      id: 'map',
      label: 'Map',
      sublabel: undefined,
      icon: <MapPin size={20} />,
      color: '#60a5fa',
      action: () => navigateToEntityList(null),
    },
  ]

  return (
    <div style={pageStyle}>
      {/* Campaign name top-left */}
      <div style={titleArea}>
        <span style={systemLabel}>{activeCampaign.system || 'Campaign'}</span>
        <h1 style={titleStyle}>{activeCampaign.name}</h1>
        {activeCampaign.description && (
          <p style={descStyle}>{activeCampaign.description}</p>
        )}
      </div>

      {/* Atmospheric glow blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: '50%', top: '45%',
          width: 560, height: 560,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,106,247,0.07) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }} />
      </div>

      {/* Hub canvas — takes all space above the bottom bar */}
      <div style={canvasStyle}>
        {/* Connector lines SVG */}
        <ConnectorLines nodes={orbitalNodes} mounted={mounted} />

        {/* Centre node */}
        <CentreNode label="World Bible" count={counts.total} mounted={mounted} />

        {/* Orbital nodes — uniform circle */}
        {orbitalNodes.map((node, i) => (
          <OrbitalNode
            key={node.id}
            node={node}
            angle={ANGLES[i]}
            index={i}
            mounted={mounted}
          />
        ))}
      </div>

      {/* Bottom bar — Settings + Switch Campaign */}
      <BottomBar
        mounted={mounted}
        onSettings={() => setView('settings')}
        onSwitch={navigateToCampaignSelect}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Connector lines
// ---------------------------------------------------------------------------

function ConnectorLines({ nodes, mounted }: { nodes: OrbitalNodeDef[]; mounted: boolean }) {
  const SIZE = 600
  const cx = SIZE / 2
  const cy = SIZE / 2

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {nodes.map((node, i) => {
        const angle = ANGLES[i]
        const tx = cx + Math.cos(angle) * ORBIT_RADIUS
        const ty = cy + Math.sin(angle) * ORBIT_RADIUS
        return (
          <line
            key={node.id}
            x1={cx}
            y1={cy}
            x2={tx}
            y2={ty}
            stroke={node.color}
            strokeWidth={1}
            strokeDasharray="4 6"
            strokeOpacity={mounted ? 0.18 : 0}
            style={{ transition: `stroke-opacity 0.6s ease ${120 + i * 55}ms` }}
          />
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Centre node
// ---------------------------------------------------------------------------

function CentreNode({ label, count, mounted }: { label: string; count: number; mounted: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${mounted ? 1 : 0.4})`,
        opacity: mounted ? 1 : 0,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
        zIndex: 10,
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: hovered
            ? 'radial-gradient(circle at 40% 35%, #3d3570, #1e1e35)'
            : 'radial-gradient(circle at 40% 35%, #2d2560, #16162a)',
          border: `2px solid ${hovered ? 'var(--accent)' : 'var(--border-light)'}`,
          boxShadow: hovered
            ? '0 0 40px rgba(124,106,247,0.35), 0 0 80px rgba(124,106,247,0.1)'
            : '0 0 24px rgba(124,106,247,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          transition: 'all 0.25s ease',
          cursor: 'default',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
          {count}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>entities</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Orbital node
// ---------------------------------------------------------------------------

function OrbitalNode({ node, angle, index, mounted }: { node: OrbitalNodeDef; angle: number; index: number; mounted: boolean }) {
  const [hovered, setHovered] = useState(false)

  const delay = 80 + index * 55
  const size = 108
  const tx = Math.cos(angle) * ORBIT_RADIUS
  const ty = Math.sin(angle) * ORBIT_RADIUS

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${mounted ? 1 : 0.2})`,
        opacity: mounted ? 1 : 0,
        transition: `transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, opacity 0.4s ease ${delay}ms`,
      }}
    >
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={node.action}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: hovered
            ? `radial-gradient(circle at 38% 32%, ${node.color}28, ${node.color}08)`
            : `radial-gradient(circle at 38% 32%, ${node.color}14, transparent)`,
          border: `${hovered ? 2 : 1.5}px solid ${hovered ? node.color : node.color + '55'}`,
          boxShadow: hovered
            ? `0 0 24px ${node.color}40, 0 4px 20px rgba(0,0,0,0.4)`
            : `0 2px 12px rgba(0,0,0,0.3)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          cursor: 'pointer',
          transform: `scale(${hovered ? 1.08 : 1})`,
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          color: node.color,
          padding: 0,
        }}
      >
        <div style={{ opacity: hovered ? 1 : 0.75, transition: 'opacity 0.2s' }}>
          {node.icon}
        </div>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'color 0.2s',
          letterSpacing: '0.02em',
        }}>
          {node.label}
        </span>
        {node.sublabel !== undefined && (
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: hovered ? node.color : 'var(--text-muted)',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}>
            {node.sublabel}
          </span>
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom bar
// ---------------------------------------------------------------------------

function BottomBar({ mounted, onSettings, onSwitch }: { mounted: boolean; onSettings: () => void; onSwitch: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '16px 32px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
        opacity: mounted ? 1 : 0,
        transform: `translateY(${mounted ? 0 : 16}px)`,
        transition: 'opacity 0.4s ease 400ms, transform 0.4s ease 400ms',
      }}
    >
      <BarButton icon={<Settings size={15} />} label="Settings" onClick={onSettings} />
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
      <BarButton icon={<LogOut size={15} />} label="Switch Campaign" onClick={onSwitch} />
    </div>
  )
}

function BarButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        border: 'none',
        color: hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
        fontSize: 13,
        fontWeight: 500,
        padding: '7px 14px',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
      <ChevronRight size={13} style={{ opacity: hovered ? 0.6 : 0, transition: 'opacity 0.15s' }} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pageStyle: React.CSSProperties = {
  flex: 1,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-primary)',
  position: 'relative',
  overflow: 'hidden',
}

const titleArea: React.CSSProperties = {
  position: 'absolute',
  top: 36,
  left: 44,
  zIndex: 20,
  maxWidth: 340,
}

const systemLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  display: 'block',
  marginBottom: 6,
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.1,
  margin: 0,
}

const descStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
}

const canvasStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
}
