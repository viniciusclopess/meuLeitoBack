const { pool } = require('../db/pool');

async function insertComorbidade(comorbidade) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!comorbidade?.nome) {
      throw new Error('Campos obrigatórios!');
    }

    // 1) Buscar comorbidade por código
    const rComorbidade = await client.query(
      'SELECT "Id" FROM "Comorbidades" WHERE "Nome" = $1',
      [comorbidade.id]
    );
    let comorbidadeDados = null

    // Não achou = Cria
    if (rComorbidade.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO "Comorbidades" ( "Nome" )
         VALUES ($1)
         RETURNING *`,
        [
          comorbidade.nome
        ]
      );
      comorbidadeDados = r.rows[0];
    } else {
      comorbidadeDados = rComorbidade.rows[0];
    }

    await client.query('COMMIT');
    return comorbidadeDados;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * selectComorbidade - paginação por OFFSET com total
 * @param {Object} opts
 * @returns {Promise<{ data: Array, total: number, page: number, pageSize: number }>}
**/
async function selectComorbidade({ nome, page = 1, pageSize = 25 } = {}) {
  // validação igual aos outros services
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.min(200, Math.max(1, Number(pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const params = [];
  let where = "";

  if (nome) {
    params.push(`%${nome}%`);
    where = `WHERE C."Nome" ILIKE $${params.length}`;
  }

  const sql = `
    SELECT
      C."Id",
      C."Nome",
      COUNT(*) OVER() AS __total_count
    FROM "Comorbidades" C
    ${where}
    ORDER BY C."Nome" ASC
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

async function updateComorbidade(id, comorbidade) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!id) throw new Error('Id obrigatório.');

    const { rows } = await client.query(
      `UPDATE "Comorbidades"
         SET "Nome"         = COALESCE($2, "Nome")
       WHERE "Id" = $1
       RETURNING *`,
      [
        id,
        comorbidade.nome ?? null
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

async function removeComorbidade(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID da comorbidade inválido.');

    const result = await client.query(
      `DELETE FROM "Comorbidades"
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
      throw new Error('Não foi possível excluir: há registros relacionados a este comorbidade.');
    }
    
    // 22P02 = id inválido (ex.: string que não converte pra int)
    if (err.code === '22P02') {
      throw new Error('ID do comorbidade inválido.');
    }

    throw err;
  } finally {
    client.release();
  }
}

module.exports = { insertComorbidade, selectComorbidade, updateComorbidade, removeComorbidade };
