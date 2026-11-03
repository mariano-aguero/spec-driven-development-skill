import { verifyPassword } from './password'
import { createSession } from './session'
import { countRecentFailures, recordFailure, findUser } from './store'

const MAX_FAILURES = 10
const WINDOW_MINUTES = 15

export async function login(email: string, password: string) {
  const failures = await countRecentFailures(email, WINDOW_MINUTES)
  if (failures >= MAX_FAILURES) return { status: 429 as const }

  const user = await findUser(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordFailure(email)
    return { status: 401 as const }
  }
  return { status: 200 as const, session: await createSession(user.id) }
}
