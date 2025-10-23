const { pool } = require('../db/pool');

async function insertPerfil(perfil) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!perfil?.nome) {
      throw new Error('Campos obrigatórios!');
    }

    // 1) Buscar perfil por código
    const rPerfil = await client.query(
      'SELECT "Id" FROM "Perfis" WHERE "Nome" = $1',
      [perfil.id]
    );
    perfilDados = null

    // Não achou = Cria
    if (rPerfil.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO "Perfis" ( "Nome" )
         VALUES ($1)
         RETURNING *`,
        [
          perfil.nome
        ]
      );
      perfilDados = r.rows[0];
    } else {
      perfilDados = rPerfil.rows[0];
    }

    await client.query('COMMIT');
    return perfilDados;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get de setores
async function selectPerfil(nome) {
  let query =
    `SELECT * 
    FROM "Perfis"`;

  const params = [];
  if (nome) {
    query += ' WHERE "Perfis"."Nome" ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePerfil(id, perfil) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!id) throw new Error('Id obrigatório.');

    const { rows } = await client.query(
      `UPDATE "Perfis"
          SET "Nome"         = COALESCE($2, "Nome")
       WHERE "Id" = $1
       RETURNING *`,
      [
        id,
        perfil.nome ?? null
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

async function removePerfil(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID do perfil inválido.');

    const result = await client.query(
      `DELETE FROM "Perfis"
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
      throw new Error('Não foi possível excluir: há registros relacionados a este perfil.');
    }
    
    // 22P02 = id inválido (ex.: string que não converte pra int)
    if (err.code === '22P02') {
      throw new Error('ID do perfil inválido.');
    }

    throw err;
  } finally {
    client.release();
  }
}

module.exports = { insertPerfil, selectPerfil, updatePerfil, removePerfil };
