const { pool } = require('../db/pool');
const bcrypt = require('bcryptjs');

/**
 * Busca um profissional pelo CPF e retorna suas permissões.
 * Junta as tabelas Profissionais, ProfissionaisPermissoes e Permissoes.
 */
async function findUserLogin(cpf) {
  const { rows } = await pool.query(
    `
    SELECT
      p."Id"                                     AS "id",
      p."Cpf"                                    AS "cpf",
      p."Senha"                                  AS "senha",
      p."Ativo"                                  AS "ativo",
      COALESCE(
        ARRAY_AGG(pm."Nome" ORDER BY pm."Nome")
        FILTER (WHERE pm."Nome" IS NOT NULL),
        '{}'
      ) AS "permissoes"
    FROM "Profissionais" p
    LEFT JOIN "ProfissionaisPermissoes" pp
      ON pp."IdProfissional" = p."Id"
    LEFT JOIN "Permissoes" pm
      ON pm."Id" = pp."IdPermissao"
    WHERE p."Cpf" = $1
    GROUP BY p."Id", p."Cpf", p."Senha", p."Ativo"
    LIMIT 1
    `,
    [cpf]
  );

  return rows[0] || null;
}

/**
 * Compara senha enviada com a armazenada.
 * Suporta tanto hash bcrypt quanto texto puro (modo dev).
 */
async function verifyPassword(plain, hashedOrPlain) {
  if (typeof hashedOrPlain === 'string' && hashedOrPlain.startsWith('$2')) {
    return bcrypt.compare(plain, hashedOrPlain); // senha com bcrypt
  }
  return plain === hashedOrPlain; // fallback pra testes locais
}

module.exports = {
  findUserLogin,
  verifyPassword,
};
