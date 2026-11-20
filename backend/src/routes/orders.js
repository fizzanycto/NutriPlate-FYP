const router = require('express').Router();
const db = require('../db');
const ai = require('../ai');
const { auth } = require('../auth');

const FLOW = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

// create order (patient for self, or family for linked patient)
router.post('/', auth(['patient', 'family']), async (req, res) => {
  const { items = [], force = false, address = '' } = req.body;
  if (!items.length) return res.status(400).json({ error: 'cart is empty' });
  const me = await db.get('users', req.user.id);
  const patientId = req.user.role === 'patient' ? me.id : req.body.patient_id;
  if (req.user.role === 'family' && !me.linkedPatients.includes(patientId))
    return res.status(403).json({ error: 'Not linked to this patient' });
  const patient = await db.get('users', patientId);

  const menu = await db.list('menu');
  const lines = [];
  for (const it of items) {
    const m = menu.find(x => x.id === it.id);
    if (!m) return res.status(400).json({ error: 'unknown item ' + it.id });
    lines.push({ ...m, qty: it.qty || 1 });
  }
  const providerIds = [...new Set(lines.map(l => l.provider_id))];
  if (providerIds.length !== 1) return res.status(400).json({ error: 'One order can contain items from one provider only' });

  // AI safety check before ordering
  const { problems } = await ai.checkItems(patient.profile, lines);
  if (problems.length && !force)
    return res.status(409).json({ error: 'Some items are not safe for this patient', problems, hint: 'send force:true to order anyway' });

  const { note } = await ai.note(patient.profile, lines);
  const order = await db.add('orders', {
    patient_id: patient.id, patient_name: patient.name, ordered_by: me.id, ordered_by_name: me.name,
    provider_id: providerIds[0], items: lines.map(l => ({ id: l.id, name: l.name, qty: l.qty, price: l.price })),
    total: lines.reduce((s, l) => s + l.price * l.qty, 0), address,
    dietary_note: note, warnings: problems, status: 'placed',
    history: [{ status: 'placed', at: new Date().toISOString() }],
    trackingCode: db.uid().slice(0, 8).toUpperCase(), createdAt: new Date().toISOString(),
  });
  res.status(201).json(order);
});

// list orders: patient/family -> theirs, provider -> own kitchen, admin -> all
router.get('/', auth(), async (req, res) => {
  const u = await db.get('users', req.user.id);
  let orders = await db.list('orders');
  if (u.role === 'patient') orders = orders.filter(o => o.patient_id === u.id);
  else if (u.role === 'family') orders = orders.filter(o => o.ordered_by === u.id);
  else if (u.role === 'provider') orders = orders.filter(o => o.provider_id === u.providerId);
  res.json(orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

// provider moves order to next stage
router.patch('/:id/status', auth(['provider', 'admin']), async (req, res) => {
  const o = await db.get('orders', req.params.id);
  if (!o) return res.status(404).json({ error: 'not found' });
  const u = await db.get('users', req.user.id);
  if (u.role === 'provider' && o.provider_id !== u.providerId) return res.status(403).json({ error: 'Not your order' });
  const next = req.body.status;
  if (next === 'cancelled') { if (o.status === 'delivered') return res.status(400).json({ error: 'already delivered' }); }
  else if (FLOW.indexOf(next) !== FLOW.indexOf(o.status) + 1)
    return res.status(400).json({ error: `Next allowed status is "${FLOW[FLOW.indexOf(o.status) + 1]}"` });
  o.status = next; o.history.push({ status: next, at: new Date().toISOString() });
  await db.set('orders', o.id, o);
  res.json(o);
});

module.exports = router;
