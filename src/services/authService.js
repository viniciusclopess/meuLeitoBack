const { pool } = require('../db/pool');
const bcrypt = require('bcryptjs');

async function findUserLogin(login) {
  const { rows } = await pool.query(
    `SELECT 
        id, 
        login,
        senha_hash,
        role 
        FROM usuarios 
        WHERE login = $1 
        LIMIT 1`,
    [login]
  );
  return rows[0] || null;
}

async function verifyPassword(plain, hashedOrPlain) {
  if (typeof hashedOrPlain === 'string' && hashedOrPlain.startsWith('$2')) {
    return bcrypt.compare(plain, hashedOrPlain);
  }
  return plain === hashedOrPlain;
}

module.exports = {
  findUserLogin,
  verifyPassword,
};
