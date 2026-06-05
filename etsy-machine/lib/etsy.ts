import type { EtsyReceipt, EtsyTrackingInput } from '@/types/etsy'

const BASE = 'https://openapi.etsy.com/v3'

function headers(): Record<string, string> {
  return {
    'x-api-key': process.env.ETSY_API_KEY!,
    Authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN!}`,
    'Content-Type': 'application/json',
  }
}

export async function getReceipt(receiptId: number): Promise<EtsyReceipt> {
  const shopId = process.env.ETSY_SHOP_ID!
  const res = await fetch(`${BASE}/application/shops/${shopId}/receipts/${receiptId}`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`Etsy getReceipt ${receiptId}: HTTP ${res.status}`)
  return res.json() as Promise<EtsyReceipt>
}

export async function createShipmentTracking(
  receiptId: number,
  tracking: EtsyTrackingInput
): Promise<void> {
  const shopId = process.env.ETSY_SHOP_ID!
  const res = await fetch(
    `${BASE}/application/shops/${shopId}/receipts/${receiptId}/tracking`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(tracking),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Etsy createShipmentTracking ${receiptId}: HTTP ${res.status} — ${text}`)
  }
}
