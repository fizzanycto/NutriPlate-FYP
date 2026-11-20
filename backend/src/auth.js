const jwt = require('jsonwebtoken');
const SECRET = () => process.env.JWT_SECRET || 'dev-secret';

const sign = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET(), { expiresIn: '7d' });

function auth(roles) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    try {
      const t = jwt.verify(h.replace('Bearer ', ''), SECRET());
      if (roles && !roles.includes(t.role)) return res.status(403).json({ error: 'Not allowed for your role' });
      req.user = t;
      next();
    } catch {
      res.status(401).json({ error: 'Login required' });
    }
  };
}
module.exports = { sign, auth };
