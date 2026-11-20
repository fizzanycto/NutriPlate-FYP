// Tiny database layer. Same functions work with a local JSON file (default)
// or Firebase Firestore (DB_MODE=firebase). Rest of the code never knows which.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uid = () => crypto.randomBytes(8).toString('hex');
const MODE = process.env.DB_MODE || 'local';

let impl;
if (MODE === 'firebase') {
  const admin = require('firebase-admin');
  const key = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(key) });
  const fs_ = admin.firestore();
  impl = {
    async get(col, id) { const d = await fs_.collection(col).doc(id).get(); return d.exists ? d.data() : null; },
    async set(col, id, obj) { await fs_.collection(col).doc(id).set(obj); return obj; },
    async remove(col, id) { await fs_.collection(col).doc(id).delete(); },
    async list(col) { const s = await fs_.collection(col).get(); return s.docs.map(d => d.data()); },
    async reset() {},
  };
} else {
  const FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');
  const load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {});
  const save = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
  impl = {
    async get(col, id) { return (load()[col] || {})[id] || null; },
    async set(col, id, obj) { const d = load(); (d[col] ||= {})[id] = obj; save(d); return obj; },
    async remove(col, id) { const d = load(); if (d[col]) delete d[col][id]; save(d); },
    async list(col) { return Object.values(load()[col] || {}); },
    async reset() { save({}); },
  };
}

module.exports = {
  ...impl,
  uid,
  async add(col, obj) { const id = obj.id || uid(); return impl.set(col, id, { ...obj, id }); },
  async find(col, fn) { return (await impl.list(col)).filter(fn); },
};
