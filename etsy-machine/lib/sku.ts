// Every Etsy listing SKU must follow this format: "{printify_product_id}:{printify_variant_id}"
// Example: "01ABCDEF12345:98765"
// This is what ties an Etsy sale to the correct Printify product and variant.

export interface SkuParts {
  productId: string
  variantId: number
}

export function parseSku(sku: string): SkuParts | null {
  const colonIdx = sku.lastIndexOf(':')
  if (colonIdx === -1) return null
  const productId = sku.slice(0, colonIdx)
  const variantId = parseInt(sku.slice(colonIdx + 1), 10)
  if (!productId || isNaN(variantId)) return null
  return { productId, variantId }
}
