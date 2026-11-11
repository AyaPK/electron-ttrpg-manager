import { Users, MapPin, Shield, Package } from 'lucide-react'
import type { EntityType } from '../../types/electron.d'

const CONFIG: Record<EntityType, { label: string; color: string; icon: React.ReactNode }> = {
  npc: { label: 'NPC', color: 'var(--npc-color)', icon: <Users size={12} /> },
  location: { label: 'Location', color: 'var(--location-color)', icon: <MapPin size={12} /> },
  faction: { label: 'Faction', color: 'var(--faction-color)', icon: <Shield size={12} /> },
  item: { label: 'Item', color: 'var(--item-color)', icon: <Package size={12} /> },
}

export function EntityTypeBadge({ type, size = 'sm' }: { type: EntityType; size?: 'sm' | 'md' }) {
  const cfg = CONFIG[type]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: size === 'md' ? 12 : 11,
      padding: size === 'md' ? '3px 9px' : '2px 7px',
      borderRadius: 20,
      background: `${cfg.color}18`,
      color: cfg.color,
      fontWeight: 500,
      border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

export function entityTypeColor(type: EntityType): string {
  return CONFIG[type].color
}

export function entityTypeLabel(type: EntityType): string {
  return CONFIG[type].label
}
