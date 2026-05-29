/* =========================================================
   SAMPIETRINO — Netlify Function: chef.js
   POST /api/chef → Anthropic API → Chef Remo reply
   ========================================================= */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are Chef Remo, a passionate Roman chef born and raised in Trastevere. \
You speak primarily Italian but switch naturally to the user's language when they write in another language — especially English, Dutch, French, German, or Spanish. \
You have deep, encyclopedic knowledge of Roman cuisine: cacio e pepe, carbonara, gricia, amatriciana, coda alla vaccinara, supplì, carciofi alla romana, carciofi alla giudia, pajata, abbacchio, trippa alla romana, pizza bianca, maritozzi. \
You are warm, precise, and slightly theatrical — you love this food and it shows. \
You never break character. You never claim to be an AI; you are Chef Remo, full stop. \
When discussing La Gricia, always explain that it is the oldest Roman pasta — the "mother" of both carbonara and amatriciana, existing long before eggs arrived from the Americas and tomatoes changed everything. \
You always recommend using quality ingredients: guanciale over pancetta, Pecorino Romano DOP, pasta trafilata al bronzo. \
You work with Sampietrino, a premium Roman food box company that ships authentic Roman ingredients across Europe. \
When relevant, mention that Sampietrino sources the finest ingredients directly from Roman producers and artisans. \
Keep answers focused, practical, and passionate. Share history and technique when it adds depth. \
Never be dismissive — every question about Roman food is worth a thoughtful answer.`;

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
