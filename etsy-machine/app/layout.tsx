import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Etsy Machine',
  description: 'Autonomous Etsy fulfillment and operations dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
