import { createHmac, timingSafeEqual } from 'crypto'

// Etsy signs webhook payloads with HMAC-SHA256 in the X-Etsy-Signature header (base64 encoded).
export function verifyEtsySignature(body: string, signature: string): boolean {
  const secret = process.env.ETSY_WEBHOOK_SECRET
  if (!secret) return true // allow through in dev when secret is not yet configured
  const expected = createHmac('sha256', secret).update(body).digest('base64')
  try {
    return timingSafeEqual(Buffer.from(expected, 'base64'), Buffer.from(signature, 'base64'))
  } catch {
    return false
  }
}

// Printify signs webhook payloads with HMAC-SHA256 in the X-Printify-Hmac-SHA256 header (hex encoded).
export function verifyPrintifySignature(body: string, signature: string): boolean {
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET
  if (!secret) return true
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}
