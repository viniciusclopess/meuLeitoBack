const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const [, token] = auth.split(' '); // "Bearer"

    if (!token) {
      return res.status(401).json({ ok: false, message: 'Token não fornecido' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload; 
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token inválido', error: err.message });
  }
}

module.exports = authMiddleware;
