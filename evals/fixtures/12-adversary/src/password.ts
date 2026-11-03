import { findUserByEmail } from './store'

export async function verifyPassword(email: string, password: string) {
  const user = await findUserByEmail(email.toLowerCase())
  if (!user) return null
  return (await user.checkPassword(password)) ? user : null
}
