const IDLE_TIMEOUT_HOURS = 12

export async function createSession(userId: string) {
  const expiresAt = Date.now() + IDLE_TIMEOUT_HOURS * 60 * 60 * 1000
  return { userId, expiresAt, cookie: { httpOnly: true, secure: true, sameSite: 'lax' as const } }
}
