# Setup Guide — Autonomous Etsy Machine

## Prerequisites
- Etsy seller account with an active shop
- Printify account
- A public HTTPS URL for webhooks (Railway, Render, DigitalOcean, or ngrok for local dev)

---

## Step 1 — Etsy API credentials

### 1.1 Create a developer app
1. Go to https://www.etsy.com/developers/your-apps
2. Click **Create a New App**
3. Fill in the form — URL can be your domain or `http://localhost:3001`
4. Copy **Keystring** → set as `ETSY_API_KEY`

### 1.2 Get an OAuth access token (PKCE flow)
Etsy v3 uses OAuth 2.0 with PKCE. The easiest path:
1. Use the [Etsy OAuth PKCE quickstart](https://developers.etsy.com/documentation/tutorials/quickstart) with Postman
2. Request scopes: `transactions_r transactions_w receipts_r receipts_w`
3. Copy **access_token** → `ETSY_ACCESS_TOKEN`
4. Copy **refresh_token** → `ETSY_REFRESH_TOKEN`

> Access tokens expire after 1 hour. The refresh token flow is documented in SETUP.md — a token refresh cron (Layer 3) will handle this automatically.

### 1.3 Find your Shop ID
```bash
curl "https://openapi.etsy.com/v3/application/shops" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
Copy the `shop_id` value → `ETSY_SHOP_ID`

### 1.4 Register the Etsy webhook
```bash
curl -X POST "https://openapi.etsy.com/v3/application/shops/YOUR_SHOP_ID/webhooks" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "receipt.payment_complete",
    "url": "https://your-domain.com/api/webhooks/etsy"
  }'
```
Etsy returns a `shared_secret` — set that as `ETSY_WEBHOOK_SECRET`.

---

## Step 2 — Printify API credentials

1. Log into Printify
2. Go to **My Profile → Connections → API**
3. Click **Generate token** → set as `PRINTIFY_API_KEY`
4. Your shop ID is in the URL: `printify.com/app/shop/{SHOP_ID}/...` → `PRINTIFY_SHOP_ID`

### Register the Printify webhook
```bash
curl -X POST "https://api.printify.com/v1/shops/YOUR_SHOP_ID/webhooks.json" \
  -H "Authorization: Bearer YOUR_PRINTIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "order:shipment:created",
    "url": "https://your-domain.com/api/webhooks/printify",
    "secret": "pick-any-random-string-32-chars"
  }'
```
Set the secret you chose as `PRINTIFY_WEBHOOK_SECRET`.

---

## Step 3 — SKU convention (critical)

Every Etsy listing must have its **SKU field** set to:
```
{printify_product_id}:{printify_variant_id}
```

Example: `01ABCDEF12345:98765`

Where to find these:
- **Product ID**: in the Printify URL when editing a product
- **Variant ID**: Printify product page → select a variant → its ID is in the API response

```bash
curl "https://api.printify.com/v1/shops/YOUR_SHOP_ID/products/YOUR_PRODUCT_ID.json" \
  -H "Authorization: Bearer YOUR_PRINTIFY_API_KEY" \
  | jq '.variants[] | {id, title}'
```

---

## Step 4 — Run locally

```bash
cd etsy-machine
npm install
cp .env.example .env
# fill in the .env values
npm run dev
```

App runs on http://localhost:3001  
Health check: http://localhost:3001/api/health

For local webhook testing, use [ngrok](https://ngrok.com):
```bash
ngrok http 3001
# use the https URL as your webhook base
```

---

## Step 5 — Deploy

### Railway (recommended for simplicity)
1. `railway init` in this directory
2. Set all env vars in the Railway dashboard
3. Deploy — Railway gives you a public HTTPS URL
4. Update your Etsy and Printify webhook URLs to the Railway domain

### DigitalOcean / VPS
```bash
npm run build && npm start
```
Use nginx or Caddy as a reverse proxy for HTTPS.

---

## Order flow summary

```
Customer pays on Etsy
  → POST /api/webhooks/etsy
  → Parse receipt, extract SKU → Printify product/variant
  → Create Printify order
  → Save mapping: Etsy receipt ID ↔ Printify order ID
  → Printify produces and ships (1–5 days)
  → POST /api/webhooks/printify
  → Look up Etsy receipt ID
  → Push tracking number to Etsy
  → Customer receives Etsy shipping notification ✓
```
