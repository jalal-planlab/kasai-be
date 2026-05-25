import './loadEnv.js'
import express from 'express'
import { config } from './config.js'
import { applySecurityMiddleware, errorHandler, notFound } from './middleware/security.js'
import { bookingRouter } from './routes/booking.js'

const app = express()

applySecurityMiddleware(app)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/bookings', bookingRouter)

app.use(notFound)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Kasai API listening on port ${config.port} (${config.isProduction ? 'production' : 'development'})`)
  console.log(
    config.smtpConfigured
      ? 'SMTP: configured'
      : 'SMTP: not configured — check kasai-be/.env',
  )
  console.log(
    `Rate limits: ${config.rateLimit.global.max}/IP per ${config.rateLimit.global.windowMs / 60000}min global, ${config.rateLimit.booking.max}/IP per ${config.rateLimit.booking.windowMs / 60000}min bookings`,
  )
})
