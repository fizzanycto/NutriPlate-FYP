// Fills the database with demo data: admin, 5 approved providers + their menus, 1 demo patient.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function seed() {
  const menuFile = path.join(__dirname, '..', '..', 'ai-service', 'app', 'data', 'menu.json');
  const { providers, items } = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
  const pw = await bcrypt.hash('123456', 8);

  await db.add('users', { id: 'admin1', name: 'Admin', email: 'admin@nutriplate.com', role: 'admin', passwordHash: pw, profile: {}, linkedPatients: [] });
  for (const p of providers) {
    await db.add('providers', { id: p.id, name: p.name, ownerId: 'owner_' + p.id, approved: true });
    await db.add('users', { id: 'owner_' + p.id, name: p.name, email: `${p.id}@nutriplate.com`, role: 'provider',
      providerId: p.id, passwordHash: pw, profile: {}, linkedPatients: [] });
  }
  for (const i of items) await db.add('menu', { ...i, available: true });
  await db.add('users', { id: 'patient1', name: 'Demo Patient', email: 'patient@nutriplate.com', role: 'patient', passwordHash: pw,
    profile: { conditions: ['diabetes'], allergies: [] }, linkedPatients: [], linkCode: 'DEMO01' });
  console.log(`Seeded: ${providers.length} providers, ${items.length} menu items.`);
  console.log('Logins (password 123456): admin@nutriplate.com | patient@nutriplate.com | p1@nutriplate.com ... p5@nutriplate.com');
}
seed();
