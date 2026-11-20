require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/admin', require('./routes/admin'));

// Public tracking page for family members: no login, just the tracking code
app.get('/api/track/:code', async (req, res) => {
  const o = (await db.find('orders', x => x.trackingCode === req.params.code.toUpperCase()))[0];
  if (!o) return res.status(404).json({ error: 'Invalid tracking code' });
  res.json({ status: o.status, history: o.history, items: o.items, total: o.total, patient_name: o.patient_name });
});

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: err.message }); });

module.exports = app;
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`NutriPlate backend running on http://localhost:${port}`));
}
