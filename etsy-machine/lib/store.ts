import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// File-backed store: survives server restarts on self-hosted Node.js.
// For Vercel / multi-instance deployments replace with a database
// (Airtable, PostgreSQL, Upstash Redis — all easy swaps).
const STORE_FILE = join(process.cwd(), '.order-map.json')

interface StoreData {
  etsyToPrintify: Record<string, string>
  printifyToEtsy: Record<string, string>
}

function read(): StoreData {
  if (!existsSync(STORE_FILE)) return { etsyToPrintify: {}, printifyToEtsy: {} }
  try {
    return JSON.parse(readFileSync(STORE_FILE, 'utf-8')) as StoreData
  } catch {
    return { etsyToPrintify: {}, printifyToEtsy: {} }
  }
}

function write(data: StoreData): void {
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function saveOrderMapping(etsyReceiptId: string, printifyOrderId: string): void {
  const data = read()
  data.etsyToPrintify[etsyReceiptId] = printifyOrderId
  data.printifyToEtsy[printifyOrderId] = etsyReceiptId
  write(data)
}

export function getEtsyReceiptId(printifyOrderId: string): string | undefined {
  return read().printifyToEtsy[printifyOrderId]
}

export function getPrintifyOrderId(etsyReceiptId: string): string | undefined {
  return read().etsyToPrintify[etsyReceiptId]
}
