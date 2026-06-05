const ENDPOINTS = [
  { name: 'Etsy Webhook', path: '/api/webhooks/etsy', desc: 'Receives order events → creates Printify orders' },
  { name: 'Printify Webhook', path: '/api/webhooks/printify', desc: 'Receives shipment events → updates Etsy tracking' },
  { name: 'Health', path: '/api/health', desc: 'API credentials status check' },
]

const LAYERS = [
  { n: 1, name: 'Research Agent', status: 'planned' },
  { n: 2, name: 'Listing Creation Agent', status: 'planned' },
  { n: 3, name: 'Store Management Agent', status: 'planned' },
  { n: 4, name: 'Customer Service Agent', status: 'planned' },
  { n: 5, name: 'Fulfillment Loop', status: 'live' },
  { n: 6, name: 'Analytics Agent', status: 'planned' },
]

export default function Dashboard() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Autonomous Etsy Machine</h1>
      <p style={{ color: '#888', marginBottom: 48 }}>Layer 5 (Fulfillment) live — all other layers in progress</p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Layers</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LAYERS.map(l => (
            <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#111', borderRadius: 8, border: '1px solid #1e1e1e' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.status === 'live' ? '#4ade80' : '#333', flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>Layer {l.n} — {l.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: l.status === 'live' ? '#4ade80' : '#444' }}>{l.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Webhook Endpoints</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ENDPOINTS.map(e => (
            <div key={e.path} style={{ padding: '12px 16px', background: '#111', borderRadius: 8, border: '1px solid #1e1e1e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{e.name}</span>
                <code style={{ fontSize: 12, color: '#555' }}>{e.path}</code>
              </div>
              <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{e.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
