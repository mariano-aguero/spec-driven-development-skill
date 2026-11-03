import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export async function query(sql: string, params: unknown[] = []) {
  const result = await pool.query(sql, params)
  return result.rows
}
