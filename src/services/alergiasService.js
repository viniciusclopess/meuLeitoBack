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

// Get de setores
async function selectAlergia(nome) {
  let query =
    `SELECT * 
    FROM "Alergias"`;

  const params = [];
  if (nome) {
    query += ' WHERE "Alergias"."Nome" ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
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
