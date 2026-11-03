import type { NextFunction, Request, Response } from 'express'
import { config } from '../config.js'
import { findClientByKey } from '../db/clients.js'

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  if (config.publicPaths.some((p) => req.path.startsWith(p))) return next()

  const key = req.header(config.apiKeyHeader)
  if (!key) return res.status(401).json({ error: 'MISSING_API_KEY' })

  const client = await findClientByKey(key)
  if (!client) return res.status(403).json({ error: 'INVALID_API_KEY' })

  res.locals.client = client
  next()
}
