import { verifyPassword } from './password'
import { createSession } from './session'

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
const failures = new Map<string, number[]>()

export async function login(email: string, password: string, now = Date.now()) {
  const cnt = (failures.get(email) ?? []).filter((t) => now - t < WINDOW_MS)
  if (cnt.length >= MAX_FAILURES) {
    const retryAfter = Math.ceil((cnt[0] + WINDOW_MS - now) / 1000)
    return { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  }

  const user = await verifyPassword(email, password)
  if (!user) {
    failures.set(email, [...cnt, now])
    return { status: 401 }
  }

  failures.delete(email)
  return { status: 200, cookie: await createSession(user.id) }
}
