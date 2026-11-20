const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

const NUTRI = ['calories', 'carbs_g', 'sugar_g', 'sodium_mg', 'protein_g', 'sat_fat_g', 'potassium_mg', 'phosphorus_mg', 'fiber_g'];

function clean(b, providerId) {
  const missing = ['name', 'price'].filter(k => b[k] === undefined);
  if (missing.length) throw new Error('missing: ' + missing.join(', '));
  const item = { provider_id: providerId, name: b.name, description: b.description || '', price: Number(b.price),
    allergens: b.allergens || [], tags: b.tags || [], available: b.available !== false };
  for (const k of NUTRI) item[k] = Number(b[k] || 0);
  return item;
}

router.get('/menu', auth(['provider']), async (req, res) => {
  const u = await db.get('users', req.user.id);
  res.json(await db.find('menu', i => i.provider_id === u.providerId));
});

router.post('/menu', auth(['provider']), async (req, res) => {
  const u = await db.get('users', req.user.id);
  try { res.status(201).json(await db.add('menu', clean(req.body, u.providerId))); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/menu/:id', auth(['provider']), async (req, res) => {
  const u = await db.get('users', req.user.id);
  const old = await db.get('menu', req.params.id);
  if (!old || old.provider_id !== u.providerId) return res.status(404).json({ error: 'not found' });
  try { res.json(await db.set('menu', old.id, { ...clean({ ...old, ...req.body }, u.providerId), id: old.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/menu/:id', auth(['provider']), async (req, res) => {
  const u = await db.get('users', req.user.id);
  const old = await db.get('menu', req.params.id);
  if (!old || old.provider_id !== u.providerId) return res.status(404).json({ error: 'not found' });
  await db.remove('menu', old.id); res.json({ deleted: true });
});

module.exports = router;
