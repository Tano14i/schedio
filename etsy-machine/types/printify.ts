export interface PrintifyOrderInput {
  external_id: string
  line_items: PrintifyLineItem[]
  shipping_method: number
  send_shipping_notification: boolean
  address_to: PrintifyAddress
}

export interface PrintifyLineItem {
  product_id: string
  variant_id: number
  quantity: number
}

export interface PrintifyAddress {
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  region: string
  address1: string
  address2: string
  city: string
  zip: string
}

export interface PrintifyOrder {
  id: string
  external_id: string
  status: string
}

export interface PrintifyShipmentWebhook {
  topic: string
  resource: {
    id: string
    type: string
    data: {
      tracking_number: string
      carrier: string
      tracking_url: string
    }
  }
}
