const { pool } = require('../db/pool');

async function insertPermissao(permissao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!permissao?.nome) {
      throw new Error('Campos obrigatórios!');
    }

    const rPermissao = await client.query(
      'SELECT "Id" FROM "Permissoes" WHERE "Nome" = $1',
      [permissao.id]
    );
    permissaoDados = null

    if (rPermissao.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO "Permissoes" ( "Nome", "Descricao" )
         VALUES ($1, $2)
         RETURNING *`,
        [
          permissao.nome,
          permissao.descricao
        ]
      );
      permissaoDados = r.rows[0];
    } else {
      permissaoDados = rPermissao.rows[0];
    }

    await client.query('COMMIT');
    return permissaoDados;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get de setores
async function selectPermissao(nome) {
  let query =
    `SELECT * 
    FROM "Permissoes"`;

  const params = [];
  if (nome) {
    query += ' WHERE "Permissoes"."Nome" ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePermissao(id, permissao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!id) throw new Error('Id obrigatório.');

    const { rows } = await client.query(
      `UPDATE "Permissoes"
          SET 
            "Nome"            = COALESCE($2, "Nome"),
            "Descricao"       = COALESCE($3, "Descricao")
       WHERE "Id" = $1
       RETURNING *`,
      [
        id,
        permissao.nome ?? null,
        permissao.descricao ?? null,
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

async function removePermissao(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID do permissao inválido.');

    const result = await client.query(
      `DELETE FROM "Permissoes"
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
      throw new Error('Não foi possível excluir: há registros relacionados a este permissao.');
    }
    
    // 22P02 = id inválido (ex.: string que não converte pra int)
    if (err.code === '22P02') {
      throw new Error('ID do permissao inválido.');
    }

    throw err;
  } finally {
    client.release();
  }
}

module.exports = { insertPermissao, selectPermissao, updatePermissao, removePermissao };
