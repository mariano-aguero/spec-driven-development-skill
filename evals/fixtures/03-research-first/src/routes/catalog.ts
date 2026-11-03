import { Router } from 'express'
import { listProducts } from '../db/products.js'

export const catalog = Router()

catalog.get('/', async (_req, res) => {
  res.json(await listProducts())
})
