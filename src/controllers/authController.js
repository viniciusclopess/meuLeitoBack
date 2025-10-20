// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { findUserLogin, verifyPassword } = require('../services/authService');

function signJwt(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

async function fazerLogin(req, res) {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ ok: false, message: 'Login e senha são obrigatórios.' });
    }

    const user = await findUserLogin(login);
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Usuário não encontrado.' });
    }

    const ok = await verifyPassword(senha, user.senha_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, message: 'Senha incorreta.' });
    }

    const token = signJwt({ id: user.id, login: user.login, role: user.role});

    return res.json({
      ok: true,
      message: 'Login bem-sucedido!',
      token,
      usuario: {
        id: user.id,
        login: user.login,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    return res.status(500).json({ ok: false, message: 'Erro interno', error: err.message });
  }
}

module.exports = { fazerLogin };
