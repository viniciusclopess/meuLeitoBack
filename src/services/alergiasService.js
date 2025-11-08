const { pool } = require('../db/pool');

async function insertAlergia(alergia) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!alergia?.nome) {
      throw new Error('Campos obrigatórios!');
    }

    // 1) Buscar alergia por código
    const rAlergia = await client.query(
      'SELECT "Id" FROM "Alergias" WHERE "Nome" = $1',
      [alergia.id]
    );
    alergiaDados = null

    // Não achou = Cria
    if (rAlergia.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO "Alergias" ( "Nome" )
         VALUES ($1)
         RETURNING *`,
        [
          alergia.nome
        ]
      );
      alergiaDados = r.rows[0];
    } else {
      alergiaDados = rAlergia.rows[0];
    }

    await client.query('COMMIT');
    return alergiaDados;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * @param {Object} opts
 * @returns {Promise<{ data: Array, total: number, page: number, pageSize: number }>}
**/
async function selectAlergia({ nome, page = 1, pageSize = 25 } = {}) {
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.min(200, Math.max(1, Number(pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const params = [];
  let where = "";

  if (nome) {
    params.push(`%${nome}%`);
    where = `WHERE A."Nome" ILIKE $${params.length}`;
  }

  const sql = `
    SELECT
      A."Id",
      A."Nome",
      COUNT(*) OVER() AS __total_count
    FROM "Alergias" A
    ${where}
    ORDER BY A."Nome" ASC
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

async function updateAlergia(id, alergia) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!id) throw new Error('Id obrigatório.');

    const { rows } = await client.query(
      `UPDATE "Alergias"
         SET "Nome"         = COALESCE($2, "Nome")
       WHERE "Id" = $1
       RETURNING *`,
      [
        id,
        alergia.nome ?? null
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

async function removeAlergia(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID da alergia inválido.');

    const result = await client.query(
      `DELETE FROM "Alergias"
        WHERE "Id" = $1
      RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) return null; // não encontrou o id
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    // 23503 = violação de chave estrangeira (há registros dependentes)
    if (err.code === '23503') {
      throw new Error('Não foi possível excluir: há registros relacionados a este alergia.');
    }
    
    // 22P02 = id inválido (ex.: string que não converte pra int)
    if (err.code === '22P02') {
      throw new Error('ID do alergia inválido.');
    }

    throw err;
  } finally {
    client.release();
  }
}

module.exports = { insertAlergia, selectAlergia, updateAlergia, removeAlergia };
