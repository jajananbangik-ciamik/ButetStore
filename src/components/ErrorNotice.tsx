import { AlertCircle } from 'lucide-react'

export function ErrorNotice({ message, action }: { message: string; action?: React.ReactNode }) {
  if (!message) {
    return null
  }
  return (
    <div className="notice notice--error" role="alert">
      <AlertCircle aria-hidden="true" />
      <span>{message}</span>
      {action}
    </div>
  )
}
