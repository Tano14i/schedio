import { NextRequest, NextResponse } from 'next/server'
import { verifyPrintifySignature } from '@/lib/signature'
import { createShipmentTracking } from '@/lib/etsy'
import { getEtsyReceiptId } from '@/lib/store'
import { logger } from '@/lib/logger'
import type { PrintifyShipmentWebhook } from '@/types/printify'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-printify-hmac-sha256') ?? ''

  if (!verifyPrintifySignature(body, sig)) {
    logger.warn('printify-webhook', 'rejected — invalid signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let event: PrintifyShipmentWebhook
  try {
    event = JSON.parse(body) as PrintifyShipmentWebhook
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.topic !== 'order:shipment:created') {
    return NextResponse.json({ ok: true })
  }

  const { id: printifyOrderId, data } = event.resource
  const etsyReceiptId = getEtsyReceiptId(printifyOrderId)

  if (!etsyReceiptId) {
    // Could be a Printify order placed manually, not through this system
    logger.warn('printify-webhook', `no Etsy mapping found for Printify order ${printifyOrderId}`)
    return NextResponse.json({ ok: true })
  }

  try {
    await createShipmentTracking(Number(etsyReceiptId), {
      tracking_code: data.tracking_number,
      carrier_name: data.carrier,
      send_bcc: false,
    })
    logger.info('printify-webhook', `tracking ${data.tracking_number} pushed to Etsy receipt ${etsyReceiptId}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('printify-webhook', `tracking update failed for Etsy receipt ${etsyReceiptId}`, err)
    return NextResponse.json({ error: 'Tracking update failed' }, { status: 500 })
  }
}
