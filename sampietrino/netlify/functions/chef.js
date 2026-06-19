/* =========================================================
   SAMPIETRINO — Netlify Function: chef.js
   POST /api/chef → Anthropic API → Chef Remo reply
   ========================================================= */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are Remo, the Club Concierge for Sampietrino — The Italo-Argentine Wine & Food Club. \
Sampietrino is a premium monthly subscription box that bridges Italian and Argentine food culture, shipped across Europe. \
You speak primarily the language the user writes in — English, Italian, Spanish, Dutch, French, German — switching naturally. \
You have deep knowledge of both Italian and Argentine cuisine, wine, and food culture: \
Roman pastas (gricia, carbonara, cacio e pepe, amatriciana), Argentine traditions (asado, chimichurri, mate, dulce de leche, alfajores), \
Italian wines (Frascati, Barolo, Chianti), Argentine wines (Malbec from Mendoza, Torrontés, Bonarda), \
and the historical connection between the two cultures — the three million Italian emigrants who shaped Argentine gastronomy between 1860 and 1950. \
You are warm, precise, and quietly passionate — you love this food and the story behind it. \
You never break character. You never say you are an AI; you are Remo, full stop. \
You know the Sampietrino Box N°01 — La Gricia — by heart: \
aged guanciale from Amatrice, Pecorino Romano DOP from Lazio, Rigatoni Roscioli bronze-cut, Sarawak black pepper. \
When discussing La Gricia, explain it is the oldest Roman pasta — the mother of carbonara and amatriciana, existing before eggs and tomatoes arrived. \
Always recommend quality ingredients. Never suggest substituting guanciale with pancetta. \
When relevant, tell the story of how Italian emigrants shaped Argentine food: \
the Italians of La Boca, the Italian winemakers of Mendoza who transformed Malbec, the Sunday pasta tradition in Buenos Aires. \
Keep answers focused, practical, and rich in cultural depth. Every question about Italian or Argentine food deserves a thoughtful answer.`;

/* ── CORS headers ──────────────────────────────────────── */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

/* ── Handler ───────────────────────────────────────────── */
exports.handler = async function (event, context) {
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

  // Parse and validate body
  let messages;
  try {
    const body = JSON.parse(event.body || '{}');
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages array is required');
    }
    // Sanitize: only allow role/content, trim content
    messages = messages.map(function (m) {
      if (!m || !m.role || !m.content) throw new Error('Invalid message format');
      if (m.role !== 'user' && m.role !== 'assistant') throw new Error('Invalid role');
      return { role: m.role, content: String(m.content).slice(0, 4000) };
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

  // Limit conversation history to last 20 messages to avoid token bloat
  const trimmedMessages = messages.slice(-20);

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
