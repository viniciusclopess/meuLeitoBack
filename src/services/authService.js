const { pool } = require('../db/pool');
const bcrypt = require('bcryptjs');

async function findUserLogin(login) {
  const { rows } = await pool.query(
    `
    SELECT
      p."Id"      AS "id",
      p."CPF"     AS "login",
      p."Senha"   AS "senha",
      p."Ativo"   AS "ativo",
      pf."Nome"   AS "perfil",  -- <- aqui
      COALESCE( ARRAY_AGG(pm."Nome" ORDER BY pm."Nome") FILTER (WHERE pm."Nome" IS NOT NULL), '{}' ) AS "permissoes"
    FROM "Profissionais" p
    LEFT JOIN "ProfissionalPermissao" pp
      ON pp."IdProfissional" = p."Id"
    LEFT JOIN "Permissoes" pm
      ON pm."Id" = pp."IdPermissao"
    INNER JOIN "Perfis" pf
      ON pf."Id" = p."IdPerfil"
    WHERE p."CPF" = $1
    GROUP BY p."Id", p."CPF", p."Senha", p."Ativo", pf."Nome"
    LIMIT 1;
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
