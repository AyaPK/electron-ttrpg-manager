import { useState } from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  style?: React.CSSProperties
  type?: 'button' | 'submit'
}

export function Button({ children, onClick, variant = 'primary', icon, disabled, loading, style, type = 'button' }: ButtonProps) {
  const [hovered, setHovered] = useState(false)

  const bg = () => {
    if (disabled || loading) return 'var(--bg-hover)'
    if (variant === 'primary') return hovered ? 'var(--accent-hover)' : 'var(--accent)'
    if (variant === 'danger') return hovered ? 'var(--danger-hover)' : 'rgba(248,113,113,0.15)'
    return hovered ? 'var(--bg-hover)' : 'transparent'
  }

  const color = () => {
    if (disabled || loading) return 'var(--text-muted)'
    if (variant === 'primary') return '#fff'
    if (variant === 'danger') return 'var(--danger)'
    return 'var(--text-secondary)'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 7,
        border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
        background: bg(),
        color: color(),
        fontWeight: 500,
        fontSize: 13,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.1s, color 0.1s',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {loading ? <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} /> : icon}
      {children}
    </button>
  )
}
