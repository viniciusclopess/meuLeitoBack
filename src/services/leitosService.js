// src/services/leitosService.js
const { pool } = require('../db/pool');

async function insertLeito(leito) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!leito?.nome) {
      throw new Error('Nome do leito é obrigatório.');
    }

    // 1) Tenta achar leito por código
    const rLeito = await client.query(
      'SELECT * FROM "Leitos" WHERE "Nome" = $1 LIMIT 1',
      [leito.nome]
    );

    if (rLeito.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Leito já cadastrado.',
        leitoId: rLeito.rows[0],
      };
    }

    // 2) Cria leito
    const rNovo = await client.query(
      `INSERT INTO "Leitos" ("Nome", "IdSetor", "Status", "Descricao")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        leito.nome,
        leito.id_setor,
        leito.status ?? "Livre",
        leito.descricao ?? null
      ]
    );

    await client.query('COMMIT');
    return rNovo.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * selectLeito - paginação por OFFSET com total
 * @param {Object} opts
 * @returns {Promise<{ data: Array, total: number, page: number, pageSize: number }>}
**/
async function selectLeito({ nome, id_setor, page = 1, pageSize = 25 } = {}) {
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.min(200, Math.max(1, Number(pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const params = [];
  const conditions = [];

  if (nome) {
    params.push(`%${nome}%`);
    conditions.push(`L."Nome" ILIKE $${params.length}`);
  }

  if (id_setor) {
    params.push(Number(id_setor));
    conditions.push(`S."Id" = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      L."Id",
      L."Nome",
      L."Status",
      S."Id"   AS "IdSetor",
      S."Nome" AS "NomeSetor",
      COUNT(*) OVER() AS __total_count
    FROM "Leitos" L
    INNER JOIN "Setores" S ON L."IdSetor" = S."Id"
    ${where}
    ORDER BY S."Nome", L."Nome"
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  params.push(pageSize, offset);

  const { rows } = await pool.query(sql, params);

  const total = rows.length ? Number(rows[0].__total_count) : 0;
  const data = rows.map(({ __total_count, ...r }) => r);

  return {
    data,
    total,
    page,
    pageSize
  };
}

async function updateLeito(id, leito) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!id) throw new Error('Campos obrigatórios.');

    const { rows } = await client.query(
      `UPDATE "Leitos"
         SET 
            "Nome"          =  COALESCE($2, "Nome"),
            "IdSetor"       =  COALESCE($3, "IdSetor"),
            "Status"        =  COALESCE($4, "Status"),
            "Descricao"     =  COALESCE($5, "Descricao")
       WHERE "Id" = $1
       RETURNING *`,
      [
        id,
        leito.nome ?? null,
        leito.id_setor ?? null,
        leito.status ?? null,
        leito.descricao ?? null
      ]
    );

    await client.query('COMMIT');
    if (rows.length === 0) return null;
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function removeLeito(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID do leito é obrigatório.');

    const rDeletado = await client.query(
      `DELETE FROM "Leitos" 
       WHERE "Id" = $1
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    if (rDeletado.rowCount === 0) return null;
    return rDeletado.rows[0];
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
  insertLeito,
  selectLeito,
  updateLeito,
  removeLeito
};
