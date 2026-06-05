export interface EtsyWebhookEvent {
  event: string
  data: EtsyReceipt
}

export interface EtsyReceipt {
  receipt_id: number
  buyer_email: string
  name: string
  first_line: string
  second_line: string | null
  city: string
  state: string
  zip: string
  country_iso: string
  transactions: EtsyTransaction[]
}

export interface EtsyTransaction {
  transaction_id: number
  quantity: number
  product_data: {
    // Must be set to "{printify_product_id}:{printify_variant_id}" on every Etsy listing
    sku: string
  }
}

export interface EtsyTrackingInput {
  tracking_code: string
  carrier_name: string
  send_bcc: boolean
}
