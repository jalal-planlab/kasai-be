import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { config } from '../config.js'

export function applySecurityMiddleware(app) {
  app.disable('x-powered-by')

  if (config.trustProxy) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1)
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          if (config.isProduction) {
            return callback(new Error('Not allowed by CORS'))
          }
          return callback(null, true)
        }
        if (config.corsOrigins.includes(origin)) {
          return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
      },
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      maxAge: 86400,
    }),
  )

  app.use(
    rateLimit({
      windowMs: config.rateLimit.global.windowMs,
      max: config.rateLimit.global.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests. Please try again later.' },
      skip: (req) => req.path === '/health',
    }),
  )

  app.use(express.json({ limit: '32kb' }))
}

export const bookingRateLimiter = rateLimit({
  windowMs: config.rateLimit.booking.windowMs,
  max: config.rateLimit.booking.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many booking attempts from this address. Please try again later.',
  },
})

export function methodNotAllowed(req, res) {
  res.status(405).json({ error: 'Method not allowed' })
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' })
}

export function errorHandler(err, _req, res, _next) {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  console.error('Unhandled error:', err)

  if (config.isProduction) {
    return res.status(500).json({ error: 'Internal server error' })
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: err instanceof Error ? err.message : 'Unknown error',
  })
}
