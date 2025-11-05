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
      pf."Nome"   AS "perfil",
      COALESCE(
        (
          SELECT json_agg(pm."Nome" ORDER BY pm."Nome")
          FROM "ProfissionalPermissao" pp
          JOIN "Permissoes" pm ON pm."Id" = pp."IdPermissao"
          WHERE pp."IdProfissional" = p."Id"
        ),
        '[]'::json
      ) AS "permissoes",
      COALESCE(
        (
          SELECT json_agg(json_build_object('Id', st."Id", 'Nome', st."Nome") ORDER BY st."Nome")
          FROM "ProfissionaisSetores" ps
          JOIN "Setores" st ON st."Id" = ps."IdSetor"
          WHERE ps."IdProfissional" = p."Id"
        ),
        '[]'::json
      ) AS "setores"

    FROM "Profissionais" p
    JOIN "Perfis" pf ON pf."Id" = p."IdPerfil"
    WHERE p."CPF" = $1
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
