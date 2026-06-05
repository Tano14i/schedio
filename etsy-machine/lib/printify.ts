import type { PrintifyOrder, PrintifyOrderInput } from '@/types/printify'

const BASE = 'https://api.printify.com/v1'

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.PRINTIFY_API_KEY!}`,
    'Content-Type': 'application/json',
  }
}

export async function createOrder(input: PrintifyOrderInput): Promise<PrintifyOrder> {
  const shopId = process.env.PRINTIFY_SHOP_ID!
  const res = await fetch(`${BASE}/shops/${shopId}/orders.json`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Printify createOrder: HTTP ${res.status} — ${text}`)
  }
  return res.json() as Promise<PrintifyOrder>
}

export async function getOrder(orderId: string): Promise<PrintifyOrder> {
  const shopId = process.env.PRINTIFY_SHOP_ID!
  const res = await fetch(`${BASE}/shops/${shopId}/orders/${orderId}.json`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`Printify getOrder ${orderId}: HTTP ${res.status}`)
  return res.json() as Promise<PrintifyOrder>
}
