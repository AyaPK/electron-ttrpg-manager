interface InputProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  type?: string
}

export function Input({ label, value, onChange, placeholder, autoFocus, type = 'text' }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ width: '100%' }}
      />
    </div>
  )
}
