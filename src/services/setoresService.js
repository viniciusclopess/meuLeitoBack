const { pool } = require('../db/pool');

async function insertSetor(setor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!setor?.nome) {
      throw new Error('Campos obrigatórios!');
    }

    // 1) Buscar setor por código
    const rSetor = await client.query(
      'SELECT "Id" FROM "Setores" WHERE "Nome" = $1',
      [setor.id]
    );
    setorDados = null

    // Não achou = Cria
    if (rSetor.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO "Setores" ( "Nome", "Ativo" )
         VALUES ($1, $2)
         RETURNING *`,
        [
          setor.nome,
          setor.ativo ?? true,
        ]
      );
      setorDados = r.rows[0];
    } else {
      setorDados = rSetor.rows[0];
    }

    await client.query('COMMIT');
    return setorDados;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * selectSetor - paginação por OFFSET com total
 * @param {Object} opts
 * @returns {Promise<{ data: Array, total: number, page: number, pageSize: number }>}
 */
async function selectSetor({ nome, page = 1, pageSize = 25 } = {}) {
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.min(200, Math.max(1, Number(pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const params = [];
  let where = "";

  if (nome) {
    params.push(`%${nome}%`);
    where = `WHERE S."Nome" ILIKE $${params.length}`;
  }

  const sql = `
    SELECT
      S."Id",
      S."Nome",
      COUNT(*) OVER() AS __total_count
    FROM "Setores" S
    ${where}
    ORDER BY S."Nome" ASC
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

async function updateSetor(id, setor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!id) throw new Error('ID é obrigatório.');
    
    const { rows } = await client.query(
      `UPDATE "Setores"
         SET "Nome"         = COALESCE($2, "Nome"),
             "Ativo"        = COALESCE($3, "Ativo")
       WHERE "Id" = $1
       RETURNING *`,
      [
        id,
        setor.nome ?? null,
        setor.ativo ?? null
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

async function removeSetor(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!id) throw new Error('ID do setor inválido.');

    const result = await client.query(
      `DELETE FROM "Setores"
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
      throw new Error('Não foi possível excluir: há registros relacionados a este setor.');
    }
    
    // 22P02 = id inválido (ex.: string que não converte pra int)
    if (err.code === '22P02') {
      throw new Error('ID do setor inválido.');
    }

    throw err;
  } finally {
    client.release();
  }
}

module.exports = { insertSetor, selectSetor, updateSetor, removeSetor };
