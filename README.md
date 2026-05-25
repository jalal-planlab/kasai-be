# Kasai Backend

Express API for Kasai Online booking notifications.

## Setup

```bash
npm install
cp .env.example .env
```

Configure SMTP and `BOOKING_NOTIFY_EMAIL` in `.env`, then:

```bash
npm run dev
```

API runs at `http://localhost:7002`.

## Production

Set in your host environment (Railway, Render, VPS, etc.):

```env
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
TRUST_PROXY=true
# SMTP_* and BOOKING_NOTIFY_EMAIL (required)
```

Start with:

```bash
npm start
```

Point the frontend `VITE_BOOKING_API_URL` at `https://your-api-domain.com/api/bookings`.

## Security

See [Security](#security) below.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (exempt from global rate limit) |
| POST | `/api/bookings` | Send booking notification email |

### POST `/api/bookings`

Accepts booking JSON from the frontend. Sends an HTML email to `BOOKING_NOTIFY_EMAIL`.

## Security

| Measure | Description |
|---------|-------------|
| **Helmet** | Sets secure HTTP headers (X-Content-Type-Options, etc.) |
| **CORS** | Only listed `CORS_ORIGIN` values; no `*` in production; no-origin requests blocked in production |
| **Global rate limit** | 100 req / 15 min per IP (prod); `/health` skipped |
| **Booking rate limit** | 5 bookings / hour per IP (prod) |
| **Trust proxy** | Correct client IP behind reverse proxy when `TRUST_PROXY=true` |
| **Body size cap** | JSON limited to 32 KB |
| **Content-Type check** | Booking POST must be `application/json` |
| **Zod validation** | Strict types, lengths, phone/date/slot enums, max 4 animal lines |
| **Error sanitization** | SMTP/internal errors hidden from clients in production |
| **Startup checks** | Production requires `CORS_ORIGIN`, SMTP, rejects wildcard CORS |
| **x-powered-by** | Disabled |

Tune limits via `RATE_LIMIT_*` and `BOOKING_RATE_LIMIT_*` in `.env`.

## Environment

See `.env.example` for all variables.
