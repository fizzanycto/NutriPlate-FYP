// End-to-end test. Needs the AI service running on :8000.
process.env.DB_FILE = require('path').join(require('os').tmpdir(), 'np_test_' + Date.now() + '.json');
process.env.JWT_SECRET = 'test';
const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');

let server, base;
const api = async (method, path, body, token) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) }, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
};

test('full flow', async (t) => {
  server = app.listen(0); base = `http://localhost:${server.address().port}/api`;
  t.after(() => server.close());
  // seed
  require('child_process').execSync('node src/seed.js', { env: process.env, cwd: __dirname + '/..' });

  const admin = (await api('POST', '/auth/login', { email: 'admin@nutriplate.com', password: '123456' })).body.token;
  const stats = await api('GET', '/admin/stats', null, admin);
  assert.equal(stats.body.approved_providers, 5);

  // new patient describes condition in words
  const reg = await api('POST', '/auth/register', { name: 'Ali', email: 'ali@x.com', password: 'pw1234', role: 'patient' });
  assert.equal(reg.status, 201);
  const pt = reg.body.token;
  const ex = await api('POST', '/patient/profile/extract', { text: 'mujhe sugar hai aur BP high hai, milk allergy' }, pt);
  assert.deepEqual(ex.body.profile.conditions.sort(), ['diabetes', 'hypertension']);

  // recommendations never contain unsafe food
  const rec = await api('POST', '/patient/recommend', { query: 'light dinner', top_k: 5 }, pt);
  assert.ok(rec.body.recommendations.length > 0);
  for (const r of rec.body.recommendations) assert.ok(!r.allergens.includes('milk') && r.sodium_mg <= 600 && r.sugar_g <= 15);

  // unsafe item is blocked, safe item orders with a note
  const bad = await api('POST', '/orders', { items: [{ id: 'm1', qty: 1 }] }, pt);
  assert.equal(bad.status, 409);
  const good = await api('POST', '/orders', { items: [{ id: rec.body.recommendations[0].id, qty: 2 }], address: 'Gujrat' }, pt);
  assert.equal(good.status, 201);
  assert.match(good.body.dietary_note, /ALLERGIES/);

  // provider moves it through the flow; family tracks by code
  const prov = (await api('POST', '/auth/login', { email: `${good.body.provider_id}@nutriplate.com`, password: '123456' })).body.token;
  assert.equal((await api('PATCH', `/orders/${good.body.id}/status`, { status: 'delivered' }, prov)).status, 400); // cannot skip
  for (const s of ['accepted', 'preparing', 'out_for_delivery']) assert.equal((await api('PATCH', `/orders/${good.body.id}/status`, { status: s }, prov)).status, 200);
  const tr = await api('GET', `/track/${good.body.trackingCode}`);
  assert.equal(tr.body.status, 'out_for_delivery');

  // family member orders for the linked patient
  const fam = (await api('POST', '/auth/register', { name: 'Bro', email: 'bro@x.com', password: 'pw1234', role: 'family' })).body.token;
  const me = await api('GET', '/auth/me', null, pt);
  assert.equal((await api('POST', '/patient/family/link', { code: me.body.linkCode }, fam)).status, 200);
  const fo = await api('POST', '/orders', { patient_id: reg.body.user.id, items: [{ id: rec.body.recommendations[0].id }] }, fam);
  assert.equal(fo.status, 201);

  // role protection
  assert.equal((await api('GET', '/admin/stats', null, pt)).status, 403);
  assert.equal((await api('GET', '/admin/stats')).status, 401);
});
