const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.get('/providers', auth(['admin']), async (_req, res) => res.json(await db.list('providers')));

router.patch('/providers/:id/approve', auth(['admin']), async (req, res) => {
  const p = await db.get('providers', req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  p.approved = req.body.approved !== false;
  res.json(await db.set('providers', p.id, p));
});

router.get('/stats', auth(['admin']), async (_req, res) => {
  const [users, orders, providers, menu] = await Promise.all(['users', 'orders', 'providers', 'menu'].map(c => db.list(c)));
  const byStatus = {};
  orders.forEach(o => (byStatus[o.status] = (byStatus[o.status] || 0) + 1));
  res.json({
    patients: users.filter(u => u.role === 'patient').length,
    providers: providers.length, approved_providers: providers.filter(p => p.approved).length,
    menu_items: menu.length, orders: orders.length, orders_by_status: byStatus,
    revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
    orders_with_diet_warnings: orders.filter(o => o.warnings && o.warnings.length).length,
  });
});

module.exports = router;
