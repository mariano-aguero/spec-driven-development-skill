import { query } from './pool.js'

export async function findClientByKey(key: string) {
  const rows = await query('select id, name from clients where api_key = $1', [key])
  return rows[0] ?? null
}
