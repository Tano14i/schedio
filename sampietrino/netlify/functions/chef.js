/* =========================================================
   SAMPIETRINO — Netlify Function: chef.js
   POST /api/chef → Anthropic API → Chef Remo reply
   ========================================================= */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

/* ── Abuse limits ──────────────────────────────────────── */
// Siti autorizzati a chiamare la function. Aggiungere il dominio
// definitivo (es. Hostinger) in ALLOWED_ORIGINS, separato da virgole.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://sampietrinonl.netlify.app')
  .split(',')
  .map(function (o) { return o.trim().replace(/\/$/, ''); })
  .filter(Boolean);
const MAX_MESSAGES = 12;          // cronologia accettata dal client
const MAX_CHARS_PER_MESSAGE = 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_PER_IP = 20;     // richieste per IP per finestra
const RATE_LIMIT_GLOBAL = 300;    // richieste per istanza per finestra

// Best-effort: lo stato vive nella singola istanza della function e si
// azzera a ogni cold start. Il tetto di spesa vero va impostato sulla
// console Anthropic.
const ipHits = new Map();
let globalHits = [];

function isRateLimited(ip, now) {
  globalHits = globalHits.filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
  const hits = (ipHits.get(ip) || []).filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
  if (hits.length >= RATE_LIMIT_PER_IP || globalHits.length >= RATE_LIMIT_GLOBAL) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  globalHits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) ipHits.clear();
  return false;
}

const SYSTEM_PROMPT = `You are Remo — not an assistant, a cook. You know every Sampietrino box by heart: what's in it, where it comes from, how to treat it in the pan. You speak like a Roman who has lived long enough to know that shortcuts ruin everything. Warm, precise, never generic.

You speak the language the user writes in — Italian, English, Dutch, Spanish, French, German — switching naturally without mentioning it.

You never break character. You never say you are an AI. You are Remo, full stop.

You know this box by heart:
Sampietrino — Carbonara Kit Romano
Price: €49 — shipped across the Netherlands

Inside:
- Mezze Maniche Rigate Russo, 500g — 100% Italian grain, bronze-cut, Cicciano 1880
- Guanciale Bracigliano Salumi, 150g — cured pork cheek, Bracigliano SA, since 1986
- Pecorino Romano, 100g
- Black pepper, whole

Everything needed for a real Roman Carbonara for 2 people. No cream. No pancetta. No shortcuts.

To order: WhatsApp +31683830571

When someone asks how to order, give them the WhatsApp number directly.
When someone asks about the box, describe it with pride — these are real ingredients, sourced seriously.
When someone asks how to cook it, guide them through the exact technique, step by step. The order: render the guanciale slowly. Beat yolks with Pecorino and pepper. Cook pasta very al dente. Off the heat, combine — the residual heat does the work. Never add cream. Never rush the guanciale.
When relevant, explain that Carbonara is built on Gricia — the oldest Roman pasta, which existed before eggs arrived from the Americas. Carbonara added the yolk. That is the only difference.
Always recommend quality. Never suggest pancetta as a substitute for guanciale. It is not the same thing.`;


/* ── CORS headers ──────────────────────────────────────── */
function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

/* ── Handler ───────────────────────────────────────────── */
exports.handler = async function (event, context) {
  const reqHeaders = event.headers || {};
  const origin = String(reqHeaders.origin || reqHeaders.Origin || '').replace(/\/$/, '');
  const CORS_HEADERS = corsHeaders(origin);

  // Solo i siti autorizzati possono usare la chiave API
  if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Origin not allowed' }),
    };
  }

  // Handle preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const ip =
    reqHeaders['x-nf-client-connection-ip'] ||
    String(reqHeaders['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown';
  if (isRateLimited(ip, Date.now())) {
    return {
      statusCode: 429,
      headers: Object.assign({}, CORS_HEADERS, { 'Retry-After': '600' }),
      body: JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    };
  }

  // Parse and validate body
  let messages;
  try {
    const body = JSON.parse(event.body || '{}');
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages array is required');
    }
    // Solo la coda della conversazione: il resto viene ignorato
    messages = messages.slice(-MAX_MESSAGES);
    // Sanitize: only allow role/content, trim content
    messages = messages.map(function (m) {
      if (!m || !m.role || !m.content) throw new Error('Invalid message format');
      if (m.role !== 'user' && m.role !== 'assistant') throw new Error('Invalid role');
      return { role: m.role, content: String(m.content).slice(0, MAX_CHARS_PER_MESSAGE) };
    });
    // Enforce alternating user/assistant — last message must be user
    if (messages[messages.length - 1].role !== 'user') {
      throw new Error('Last message must be from user');
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Bad request: ' + err.message }),
    };
  }

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[chef.js] ANTHROPIC_API_KEY is not set');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  // Anthropic richiede che la conversazione inizi con un messaggio utente
  while (messages.length && messages[0].role !== 'user') messages.shift();
  const trimmedMessages = messages;

  // Call Anthropic API
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[chef.js] Anthropic API error:', response.status, errorBody);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'AI service unavailable. Please try again.' }),
      };
    }

    const data = await response.json();

    // Extract text from response
    const reply =
      data &&
      data.content &&
      data.content[0] &&
      data.content[0].type === 'text'
        ? data.content[0].text
        : 'Non ho capito la domanda. Puoi ripetere?';

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('[chef.js] Unexpected error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
