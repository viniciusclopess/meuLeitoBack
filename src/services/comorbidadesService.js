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

// Get de setores
async function selectComorbidade(nome) {
  let query =
    `SELECT * 
    FROM "Comorbidades"`;

  const params = [];
  if (nome) {
    query += ' WHERE "Comorbidades"."Nome" ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
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
