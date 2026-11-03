type User = { id: string; email: string; checkPassword(p: string): Promise<boolean> }

const users = new Map<string, User>()
const sessions = new Map<string, string>()

export async function findUserByEmail(email: string) {
  return users.get(email) ?? null
}

export async function saveSession(id: string, userId: string) {
  sessions.set(id, userId)
}
