export function requireJsonContentType(req, res, next) {
  const contentType = req.headers['content-type'] ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' })
  }
  next()
}
