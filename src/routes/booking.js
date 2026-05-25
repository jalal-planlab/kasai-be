import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { bookingRateLimiter, methodNotAllowed } from '../middleware/security.js'
import { requireJsonContentType } from '../middleware/validateContentType.js'
import { sendBookingEmail } from '../services/email.js'

const MAX_TEXT = 200
const MAX_ADDRESS = 500
const MAX_INSTRUCTIONS = 1000

const animalSelectionSchema = z.object({
  type: z.enum(['bakra', 'bachra', 'dumba', 'oont']),
  name: z.string().min(1),
  count: z.number().int().min(1).max(10),
  baseUnitPrice: z.number().nonnegative(),
  baseSubtotal: z.number().nonnegative(),
})

const priceBreakdownSchema = z.object({
  animalsSubtotal: z.number().nonnegative(),
  dayLabel: z.string(),
  daySurcharge: z.number(),
  slotLabel: z.string(),
  slotSurcharge: z.number(),
  totalPrice: z.number().nonnegative(),
})

const bookingSchema = z.object({
  reference: z
    .string()
    .min(6)
    .max(12)
    .regex(/^\d{6}$/, 'Invalid reference'),
  fullName: z.string().min(2).max(MAX_TEXT).trim(),
  phone: z
    .string()
    .min(10)
    .max(20)
    .regex(/^03\d{2}-?\d{7}$/, 'Invalid phone format'),
  city: z.string().min(1).max(80).trim(),
  address: z.string().min(10).max(MAX_ADDRESS).trim(),
  preferredDate: z.enum(['2026-05-27', '2026-05-28', '2026-05-29']),
  preferredDateLabel: z.string().max(MAX_TEXT),
  preferredTimeSlot: z.enum(['early', 'morning', 'afternoon', 'evening']),
  preferredTimeSlotLabel: z.string().max(MAX_TEXT),
  animalSelections: z.array(animalSelectionSchema).min(1).max(4),
  specialInstructions: z.string().max(MAX_INSTRUCTIONS).trim().optional(),
  priceBreakdown: priceBreakdownSchema,
})

export const bookingRouter = Router()

bookingRouter.post(
  '/',
  bookingRateLimiter,
  requireJsonContentType,
  async (req, res) => {
    const parsed = bookingSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid booking data',
        ...(config.isProduction
          ? {}
          : { details: parsed.error.flatten().fieldErrors }),
      })
    }

    try {
      await sendBookingEmail(parsed.data)
      return res.status(200).json({
        ok: true,
        reference: parsed.data.reference,
        message: 'Booking notification sent',
      })
    } catch (err) {
      console.error('Failed to send booking email:', err)
      return res.status(500).json({
        error: 'Failed to send booking notification',
        ...(config.isProduction
          ? {}
          : { message: err instanceof Error ? err.message : 'Unknown error' }),
      })
    }
  },
)

bookingRouter.all('/', methodNotAllowed)
