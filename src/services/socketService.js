const { pool } = require('../db/pool');

async function selectProfissionaisSetoresSocket(IdProfissional) {
  const { rows } = await pool.query(
    `
      SELECT s."Id", s."Nome"
      FROM "ProfissionaisSetores" ps
      INNER JOIN "Setores" s ON s."Id" = ps."IdSetor"
      WHERE ps."IdProfissional" = $1
    `,
    [IdProfissional]
  );
  return rows;
}

module.exports = { selectProfissionaisSetoresSocket };