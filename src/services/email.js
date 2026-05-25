import nodemailer from 'nodemailer'

function getTransporter() {
  const SMTP_HOST = process.env.SMTP_HOST?.trim()
  const SMTP_USER = process.env.SMTP_USER?.trim()
  const SMTP_PASS = process.env.SMTP_PASS?.trim()
  const SMTP_PORT = process.env.SMTP_PORT?.trim()
  const SMTP_SECURE = process.env.SMTP_SECURE?.trim()

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

function formatPKR(amount) {
  return `PKR ${Number(amount).toLocaleString('en-PK')}`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildBookingEmailHtml(booking) {
  const {
    reference,
    fullName,
    phone,
    city,
    address,
    preferredDateLabel,
    preferredTimeSlotLabel,
    animalSelections,
    specialInstructions,
    priceBreakdown,
  } = booking

  const animalRows = animalSelections
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.count}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatPKR(item.baseSubtotal)}</td>
        </tr>`,
    )
    .join('')

  const instructionsBlock = specialInstructions
    ? `<p><strong>Special instructions:</strong><br>${escapeHtml(specialInstructions).replace(/\n/g, '<br>')}</p>`
    : '<p><em>No special instructions</em></p>'

  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;color:#1a1a1a;line-height:1.5;">
  <h2 style="color:#b8860b;">New Kasai Online Booking</h2>
  <p><strong>Reference:</strong> ${escapeHtml(reference)}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <h3>Customer</h3>
  <p><strong>Name:</strong> ${escapeHtml(fullName)}<br>
     <strong>Phone:</strong> ${escapeHtml(phone)}<br>
     <strong>City:</strong> ${escapeHtml(city)}<br>
     <strong>Address:</strong> ${escapeHtml(address)}</p>
  <h3>Schedule</h3>
  <p><strong>Date:</strong> ${escapeHtml(preferredDateLabel)}<br>
     <strong>Time slot:</strong> ${escapeHtml(preferredTimeSlotLabel)}</p>
  <h3>Animals</h3>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px 12px;text-align:left;">Animal</th>
        <th style="padding:8px 12px;text-align:center;">Qty</th>
        <th style="padding:8px 12px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${animalRows}</tbody>
  </table>
  <h3>Pricing</h3>
  <p>
    Animals subtotal: ${formatPKR(priceBreakdown.animalsSubtotal)}<br>
    Day (${escapeHtml(priceBreakdown.dayLabel)}): ${formatPKR(priceBreakdown.daySurcharge)} surcharge<br>
    Slot (${escapeHtml(priceBreakdown.slotLabel)}): ${formatPKR(priceBreakdown.slotSurcharge)} adjustment<br>
    <strong>Total: ${formatPKR(priceBreakdown.totalPrice)}</strong>
  </p>
  ${instructionsBlock}
</body>
</html>`
}

export async function sendBookingEmail(booking) {
  const transporter = getTransporter()
  const notifyEmail = process.env.BOOKING_NOTIFY_EMAIL
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER

  if (!transporter) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.')
  }

  if (!notifyEmail) {
    throw new Error('BOOKING_NOTIFY_EMAIL is not configured.')
  }

  const subject = `New booking #${booking.reference} — ${booking.fullName}`
  const html = buildBookingEmailHtml(booking)
  const text = [
    `New Kasai Online booking #${booking.reference}`,
    '',
    `Name: ${booking.fullName}`,
    `Phone: ${booking.phone}`,
    `City: ${booking.city}`,
    `Address: ${booking.address}`,
    `Date: ${booking.preferredDateLabel}`,
    `Time: ${booking.preferredTimeSlotLabel}`,
    '',
    'Animals:',
    ...booking.animalSelections.map(
      (a) => `  - ${a.name} x${a.count} (${formatPKR(a.baseSubtotal)})`,
    ),
    '',
    `Total: ${formatPKR(booking.priceBreakdown.totalPrice)}`,
    booking.specialInstructions
      ? `Instructions: ${booking.specialInstructions}`
      : 'Instructions: (none)',
  ].join('\n')

  await transporter.sendMail({
    from,
    to: notifyEmail,
    replyTo: booking.phone.includes('@') ? booking.phone : undefined,
    subject,
    text,
    html,
  })
}
