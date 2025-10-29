const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function autenticarJWT(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        message: 'Token não informado.'
      });
    }

    // Esperado: "Bearer abc.def.ghi"
    const partes = authHeader.split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
      return res.status(401).json({
        ok: false,
        message: 'Formato de token inválido.'
      });
    }

    const token = partes[1];

    // Verifica e decodifica
    const decoded = jwt.verify(token, JWT_SECRET);

    // Disponibiliza o usuário para as próximas rotas
    req.user = decoded; 
    // req.user = { sub, cpf, permissoes: [...], iat, exp }

    return next();

  } catch (err) {
    console.error('Erro no autenticarJWT:', err.message);
    return res.status(401).json({
      ok: false,
      message: 'Token inválido ou expirado.',
      error: err.message
    });
  }
}

module.exports = {
  autenticarJWT,
};
