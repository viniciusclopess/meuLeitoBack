const jwt = require('jsonwebtoken');
const { findUserLogin, verifyPassword } = require('../services/authService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

async function fazerLogin(req, res) {
  try {
    const { login, senha } = req.body;

    // 1) Buscar usuário no banco
    const user = await findUserLogin(login);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Login ou senha inválidos.'
      });
    }

    if (!user.ativo) {
      return res.status(403).json({
        ok: false,
        message: 'Usuário inativo.'
      });
    }

    // 2) Validar senha
    const senhaValida = await verifyPassword(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({
        ok: false,
        message: 'Login ou senha inválidos.'
      });
    }

    // 3) Montar payload do token
    const payload = {
      sub: user.id,                // subject = id do usuário
      login: user.login,
      permissoes: user.permissoes, // array de permissões
    };

    // 4) Gerar token
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 5) Resposta
    return res.status(200).json({
      ok: true,
      message: 'Login efetuado com sucesso.',
      token,
      usuario: {
        id: user.id,
        login: user.login,
        permissoes: user.permissoes
      }
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({
      ok: false,
      message: 'Erro interno ao autenticar.',
      error: err.message
    });
  }
}

module.exports = {
  fazerLogin
};
