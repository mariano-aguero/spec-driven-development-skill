import { randomBytes } from 'node:crypto'
import { db } from '../db/client'

export async function createApiKey(userId: string) {
  const key = `sk_${randomBytes(24).toString('hex')}`
  await db.query('insert into api_keys (user_id, key) values ($1, $2)', [userId, key])
  return key
}

export async function findUserByApiKey(key: string) {
  const { rows } = await db.query('select user_id from api_keys where key = $1', [key])
  return rows[0]?.user_id ?? null
}

export async function revokeApiKey(key: string) {
  await db.query('delete from api_keys where key = $1', [key])
}
