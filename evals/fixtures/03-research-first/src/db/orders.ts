import { query } from './pool.js'

export const listOrders = (clientId: string) =>
  query('select id, sku, quantity, created_at from orders where client_id = $1 order by created_at desc', [clientId])

export async function createOrder(clientId: string, order: { sku: string; quantity: number }) {
  const rows = await query(
    'insert into orders (client_id, sku, quantity) values ($1, $2, $3) returning id, sku, quantity, created_at',
    [clientId, order.sku, order.quantity],
  )
  return rows[0]
}
