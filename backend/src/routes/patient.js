const router = require('express').Router();
const db = require('../db');
const ai = require('../ai');
const { auth } = require('../auth');

// patient edits profile by form
router.put('/profile', auth(['patient']), async (req, res) => {
  const u = await db.get('users', req.user.id);
  u.profile = { conditions: req.body.conditions || [], allergies: req.body.allergies || [] };
  await db.set('users', u.id, u);
  res.json(u.profile);
});

// patient describes condition in words (text now, voice in Phase 4) -> AI extracts
router.post('/profile/extract', auth(['patient']), async (req, res) => {
  const u = await db.get('users', req.user.id);
  const found = await ai.extractProfile(req.body.text || '');
  u.profile = {
    conditions: [...new Set([...u.profile.conditions, ...found.conditions])],
    allergies: [...new Set([...u.profile.allergies, ...found.allergies])],
  };
  await db.set('users', u.id, u);
  res.json({ extracted: found, profile: u.profile });
});

// family member links to a patient with the patient's code
router.post('/family/link', auth(['family']), async (req, res) => {
  const p = (await db.find('users', x => x.linkCode === (req.body.code || '').toUpperCase()))[0];
  if (!p) return res.status(404).json({ error: 'Invalid code' });
  const f = await db.get('users', req.user.id);
  if (!f.linkedPatients.includes(p.id)) f.linkedPatients.push(p.id);
  await db.set('users', f.id, f);
  res.json({ linked: { id: p.id, name: p.name } });
});

// recommendations from all APPROVED providers, filtered for this patient
router.post('/recommend', auth(['patient', 'family']), async (req, res) => {
  const patientId = req.user.role === 'patient' ? req.user.id : req.body.patient_id;
  const patient = await db.get('users', patientId);
  if (!patient) return res.status(404).json({ error: 'patient not found' });
  const me = await db.get('users', req.user.id);
  if (req.user.role === 'family' && !me.linkedPatients.includes(patientId))
    return res.status(403).json({ error: 'Not linked to this patient' });

  const approved = new Set((await db.find('providers', p => p.approved)).map(p => p.id));
  const items = (await db.list('menu')).filter(i => approved.has(i.provider_id) && i.available !== false);
  const result = await ai.recommend({
    profile: patient.profile, query: req.body.query, top_k: req.body.top_k || 10,
    max_price: req.body.max_price, items,
  });
  res.json(result);
});

router.get('/providers', async (_req, res) => res.json(await db.find('providers', p => p.approved)));

module.exports = router;
