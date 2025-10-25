// src/services/leitosService.js
const { pool } = require('../db/pool');

async function createLeito({ Nome, IdSetor, Status, Descricao }) {
  const cols = ['"Nome"', '"IdSetor"'];
  const params = [Nome, IdSetor];
  const ph = ['$1', '$2'];

  if (typeof Descricao !== 'undefined') {
    cols.push('"Descricao"');
    params.push(Descricao);
    ph.push(`$${ph.length + 1}`);
  }

  if (typeof Status !== 'undefined') {
    cols.push('"Status"');
    params.push(Status);
    ph.push(`$${ph.length + 1}`);
  }

  const sql = `INSERT INTO "Leitos" (${cols.join(', ')})
               VALUES (${ph.join(', ')})
               RETURNING *;`;

  const { rows } = await pool.query(sql, params);
  return rows[0];
}

async function listLeitos({ nome, statuses = [], idSetor, ativo }) {
  const where = [];
  const params = [];

  if (nome) {
    params.push(`%${nome}%`);
    where.push(`l."Nome" ILIKE $${params.length}`);
  }

  if (statuses.length) {
    const base = params.length;
    const ph = statuses.map((_, i) => `$${base + i + 1}`).join(', ');
    where.push(`l."Status" IN (${ph})`);
    params.push(...statuses);
  }

  if (idSetor) {
    params.push(idSetor);
    where.push(`l."IdSetor" = $${params.length}`);
  }

  if (typeof ativo === 'boolean') {
    params.push(ativo);
    where.push(`l."Ativo" = $${params.length}`);
  }

  const sql = `
    SELECT 
      l."Id",
      l."Nome",
      l."Descricao",
      l."IdSetor",
      s."Nome" AS "SetorNome",
      l."Status",
      l."Ativo"
    FROM "Leitos" l
    INNER JOIN "Setores" s
      ON l."IdSetor" = s."Id"
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l."Nome";
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}


async function updateLeito(id, { Nome, Status, Ativo }) {
  const sets = [];
  const params = [];
  let idx = 1;

  if (typeof Nome !== 'undefined') { sets.push(`"Nome" = $${idx++}`); params.push(Nome); }
  if (typeof Status !== 'undefined') { sets.push(`"Status" = $${idx++}`); params.push(Status); }
  if (typeof Ativo !== 'undefined') { sets.push(`"Ativo" = $${idx++}`); params.push(Ativo); }

  if (!sets.length) return null;

  params.push(id);
  const sql = `
    UPDATE "Leitos"
       SET ${sets.join(', ')}
     WHERE "Id" = $${idx}
     RETURNING *;
  `;
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

async function removeLeito(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID do leito é obrigatório.');

    const result = await client.query(
      `DELETE FROM leitos 
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) return null;
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    // Tratamento para violação de integridade (FK)
    if (err.code === '23503') {
      throw new Error(
        'Não foi possível excluir: há registros relacionados a esta pessoa.'
      );
    }

    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createLeito,
  listLeitos,
  updateLeito,
  removeLeito
};
