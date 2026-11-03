import { findUserByApiKey } from './api-keys'

export async function authenticate(req: { headers: Record<string, string | undefined> }) {
  const key = req.headers['x-api-key']
  if (!key) return null
  return findUserByApiKey(key)
}
