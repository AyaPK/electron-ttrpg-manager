import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  title: string
  message: React.ReactNode
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
