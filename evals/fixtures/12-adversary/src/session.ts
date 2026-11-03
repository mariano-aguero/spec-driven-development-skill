import { randomBytes } from 'node:crypto'
import { saveSession } from './store'

export async function createSession(userId: string) {
  const id = randomBytes(32).toString('hex')
  await saveSession(id, userId)
  return { name: 'session', value: id, httpOnly: true, secure: true, sameSite: 'Lax' as const }
}
