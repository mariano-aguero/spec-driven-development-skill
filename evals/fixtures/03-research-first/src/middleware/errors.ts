import type { NextFunction, Request, Response } from 'express'
import { logger } from '../logger.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'unhandled')
  res.status(500).json({ error: 'INTERNAL' })
}
