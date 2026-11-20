// Calls the Python AI service (Phase 1).
const base = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function call(path, body) {
  const r = await fetch(base() + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('AI service error ' + r.status);
  return r.json();
}
module.exports = {
  extractProfile: (text) => call('/extract-profile', { text }),
  recommend: (b) => call('/recommend', b),
  checkItems: (profile, items) => call('/check-items', { profile, items }),
  note: (profile, order_items) => call('/prescription-note', { profile, order_items }),
};
