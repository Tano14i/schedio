import { NextRequest, NextResponse } from 'next/server'
import { verifyEtsySignature } from '@/lib/signature'
import { createOrder } from '@/lib/printify'
import { saveOrderMapping } from '@/lib/store'
import { parseSku } from '@/lib/sku'
import { logger } from '@/lib/logger'
import type { EtsyWebhookEvent } from '@/types/etsy'
import type { PrintifyOrderInput } from '@/types/printify'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-etsy-signature') ?? ''

  if (!verifyEtsySignature(body, sig)) {
    logger.warn('etsy-webhook', 'rejected — invalid signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let event: EtsyWebhookEvent
  try {
    event = JSON.parse(body) as EtsyWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only act on completed payments
  if (event.event !== 'receipt.payment_complete') {
    return NextResponse.json({ ok: true })
  }

  const receipt = event.data
  logger.info('etsy-webhook', `receipt ${receipt.receipt_id} — payment complete, starting fulfillment`)

  const lineItems = receipt.transactions.flatMap(t => {
    const parts = parseSku(t.product_data.sku)
    if (!parts) {
      logger.warn('etsy-webhook', `unparseable SKU "${t.product_data.sku}" on transaction ${t.transaction_id} — skipping`)
      return []
    }
    return [{ product_id: parts.productId, variant_id: parts.variantId, quantity: t.quantity }]
  })

  if (lineItems.length === 0) {
    logger.error('etsy-webhook', `receipt ${receipt.receipt_id}: no valid SKUs — set listing SKU to {printifyProductId}:{variantId}`)
    return NextResponse.json({ error: 'No fulfillable line items' }, { status: 422 })
  }

  const [firstName, ...rest] = receipt.name.split(' ')
  const lastName = rest.join(' ') || firstName

  const orderInput: PrintifyOrderInput = {
    external_id: String(receipt.receipt_id),
    line_items: lineItems,
    shipping_method: 1,
    send_shipping_notification: false, // Etsy handles buyer shipping notification
    address_to: {
      first_name: firstName,
      last_name: lastName,
      email: receipt.buyer_email,
      phone: '',
      country: receipt.country_iso,
      region: receipt.state,
      address1: receipt.first_line,
      address2: receipt.second_line ?? '',
      city: receipt.city,
      zip: receipt.zip,
    },
  }

  try {
    const printifyOrder = await createOrder(orderInput)
    saveOrderMapping(String(receipt.receipt_id), printifyOrder.id)
    logger.info('etsy-webhook', `receipt ${receipt.receipt_id} → printify order ${printifyOrder.id}`)
    return NextResponse.json({ ok: true, printify_order_id: printifyOrder.id })
  } catch (err) {
    logger.error('etsy-webhook', `fulfillment failed for receipt ${receipt.receipt_id}`, err)
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 })
  }
}
