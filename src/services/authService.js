const { pool } = require('../db/pool');
const bcrypt = require('bcryptjs');

async function findUserLogin(login) {
  const { rows } = await pool.query(
    `
    SELECT
      p."Id"                                     AS "id",
      p."Cpf"                                    AS "login",
      p."Senha"                                  AS "senha",
      p."Ativo"                                  AS "ativo",
      COALESCE(
        ARRAY_AGG(pm."Nome" ORDER BY pm."Nome")
        FILTER (WHERE pm."Nome" IS NOT NULL),
        '{}'
      ) AS "permissoes"
    FROM "Profissionais" p
    LEFT JOIN "ProfissionalPermissao" pp
      ON pp."IdProfissional" = p."Id"
    LEFT JOIN "Permissoes" pm
      ON pm."Id" = pp."IdPermissao"
    WHERE p."Cpf" = $1
    GROUP BY p."Id", p."Cpf", p."Senha", p."Ativo"
    LIMIT 1
    `,
    [login]
  );

  return rows[0] || null;
}

async function verifyPassword(plain, hashedOrPlain) {
  if (typeof hashedOrPlain === 'string' && hashedOrPlain.startsWith('$2')) {
    return bcrypt.compare(plain, hashedOrPlain); // senha com bcrypt
  }
  return plain === hashedOrPlain; 
}

module.exports = {
  findUserLogin,
  verifyPassword
};
