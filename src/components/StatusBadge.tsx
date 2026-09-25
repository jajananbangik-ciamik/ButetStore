import { statusLabel, statusTone } from '../lib/format'
import type { OrderStatus } from '../types'

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-badge status-badge--${statusTone(status)}`}>{statusLabel(status)}</span>
}
