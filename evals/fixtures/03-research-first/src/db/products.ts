import { query } from './pool.js'

export const listProducts = () => query('select sku, name, price_cents from products order by name')
