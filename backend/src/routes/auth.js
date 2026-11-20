const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, auth } = require('../auth');

// role: patient | family | provider | admin(only via seed)
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'patient', providerName } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  if (!['patient', 'family', 'provider'].includes(role)) return res.status(400).json({ error: 'invalid role' });
  if ((await db.find('users', u => u.email === email.toLowerCase())).length)
    return res.status(409).json({ error: 'Email already registered' });

  const user = {
    name, email: email.toLowerCase(), role, passwordHash: await bcrypt.hash(password, 8),
    profile: { conditions: [], allergies: [] }, linkedPatients: [],
    linkCode: role === 'patient' ? db.uid().slice(0, 6).toUpperCase() : undefined,
    createdAt: new Date().toISOString(),
  };
  const saved = await db.add('users', user);
  if (role === 'provider') {
    const p = await db.add('providers', { name: providerName || name + ' Kitchen', ownerId: saved.id, approved: false });
    saved.providerId = p.id; await db.set('users', saved.id, saved);
  }
  res.status(201).json({ token: sign(saved), user: strip(saved) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = (await db.find('users', x => x.email === (email || '').toLowerCase()))[0];
  if (!u || !(await bcrypt.compare(password || '', u.passwordHash))) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(u), user: strip(u) });
});

router.get('/me', auth(), async (req, res) => res.json(strip(await db.get('users', req.user.id))));

const strip = ({ passwordHash, ...rest }) => rest;
module.exports = router;
module.exports.strip = strip;
