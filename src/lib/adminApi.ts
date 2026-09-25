import { apiPost } from './api'

export function adminPost<T>(sessionToken: string, action: string, payload: Record<string, unknown> = {}) {
  return apiPost<T>({ ...payload, action, sessionToken })
}
