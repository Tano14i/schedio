import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    credentials: {
      etsy_api_key: !!process.env.ETSY_API_KEY,
      etsy_access_token: !!process.env.ETSY_ACCESS_TOKEN,
      etsy_shop_id: !!process.env.ETSY_SHOP_ID,
      printify_api_key: !!process.env.PRINTIFY_API_KEY,
      printify_shop_id: !!process.env.PRINTIFY_SHOP_ID,
      anthropic_api_key: !!process.env.ANTHROPIC_API_KEY,
    },
  })
}
