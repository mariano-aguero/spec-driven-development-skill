import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { logger } from './logger.js'
import { requireApiKey } from './middleware/auth.js'
import { errorHandler } from './middleware/errors.js'
import { orders } from './routes/orders.js'
import { catalog } from './routes/catalog.js'

const app = express()

app.use(cors({ origin: config.corsOrigins }))
app.use(express.json({ limit: '100kb' }))
app.use(requireApiKey)

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/v1/catalog', catalog)
app.use('/v1/orders', orders)

app.use(errorHandler)

app.listen(config.port, () => logger.info({ port: config.port }, 'listening'))
