const isProduction = process.env.NODE_ENV === 'production'

function requireInProduction(name, value) {
  if (isProduction && !value?.trim()) {
    throw new Error(`${name} is required when NODE_ENV=production`)
  }
}

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 7002,
  trustProxy: process.env.TRUST_PROXY === 'true' || Number(process.env.TRUST_PROXY) > 0,
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimit: {
    global: {
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 300),
    },
    booking: {
      windowMs: Number(process.env.BOOKING_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
      max: Number(process.env.BOOKING_RATE_LIMIT_MAX) || (isProduction ? 5 : 30),
    },
  },
  smtpConfigured: Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  ),
}

requireInProduction('CORS_ORIGIN', process.env.CORS_ORIGIN)

if (config.isProduction && config.corsOrigins.includes('*')) {
  throw new Error('CORS_ORIGIN must not use "*" in production')
}

if (config.isProduction && !config.smtpConfigured) {
  throw new Error('SMTP must be configured when NODE_ENV=production')
}
