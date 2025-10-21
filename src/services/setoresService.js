const { pool } = require('../db/pool');

async function insertSetor(setor = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!setor?.codigo_setor || !setor?.nome) {
      throw new Error('Campos obrigatórios!');
    }
    const codSetor = setor.codigo_setor

    // 1) Buscar setor por código
    const rSetor = await client.query(
      'SELECT id FROM setores WHERE codigo_setor = $1',
      [codSetor]
    );
    setorDados = null

    // Não achou = Cria
    if (rSetor.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO setores (codigo_setor, nome, descricao, andar, ativo )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          codSetor,
          setor.nome,
          setor.descricao ?? null,
          setor.andar ?? null,
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

// Get de setores
async function selectSetor(codigo_setor) {
  let query =
    `SELECT * 
    FROM setores`;

  const params = [];
  if (codigo_setor) {
    query += ' WHERE setores.codigo_setor ILIKE $1';
    params.push(`%${codigo_setor}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updateSetor(setor = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!setor.id) throw new Error('Código do setor obrigatório.');

    const novoCodigo = setor.codigo_setor ?? null;

    const { rows } = await client.query(
      `UPDATE setores
         SET codigo_setor = COALESCE($2, codigo_setor),
             nome         = COALESCE($3, nome),
             descricao    = COALESCE($4, descricao),
             andar        = COALESCE($5, andar),
             ativo        = COALESCE($6, ativo)
       WHERE id = $1
       RETURNING *`,
      [
        setor.id,
        novoCodigo,
        setor.nome ?? null,
        setor.descricao ?? null,
        setor.andar ?? null,
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

    if (!id || !Number.isInteger(id) || id <= 0) {
      throw new Error('ID do setor inválido.');
    }

    const result = await client.query(
      `DELETE FROM setores
        WHERE id = $1
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
