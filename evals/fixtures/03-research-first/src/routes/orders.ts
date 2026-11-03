import { Router } from 'express'
import { z } from 'zod'
import { validateBody } from '../middleware/validate.js'
import { createOrder, listOrders } from '../db/orders.js'

const NewOrder = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive().max(100),
})

export const orders = Router()

orders.get('/', async (_req, res) => {
  res.json(await listOrders(res.locals.client.id))
})

orders.post('/', validateBody(NewOrder), async (req, res) => {
  const order = await createOrder(res.locals.client.id, req.body)
  res.status(201).json(order)
})
