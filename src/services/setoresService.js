// src/services/leitosService.js
const { pool } = require('../config/db');

async function createSetor(setor = {}) {
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
        `INSERT INTO setores (codigo_setor, nome, andar, ativo )
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          codSetor,
          setor.nome,
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

// Get de 1 setor
async function selectSetor(codigo_setor) {
  if (!codigo_setor) throw new Error('Código do setor é obrigatório.');

  const { rows } = await pool.query(
    `SELECT * FROM setores
     WHERE codigo_setor = $1
     LIMIT 1`,
    [codigo_setor]
  );

  if (rows.length === 0) return null;
  return rows[0];
}

async function updateSetor(codigo_setor, setor = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!codigo_setor) throw new Error('Código do setor obrigatório.');

    const novoCodigo = setor.novo_codigo_setor ?? null;

    const { rows } = await client.query(
      `UPDATE setores
         SET codigo_setor = COALESCE($2, codigo_setor),
             nome         = COALESCE($3, nome),
             andar        = COALESCE($4, andar),
             ativo        = COALESCE($5, ativo)
       WHERE codigo_setor = $1
       RETURNING *`,
      [
        codigo_setor,           // $1
        novoCodigo,             // $2
        setor.nome ?? null,     // $3
        setor.andar ?? null,    // $4
        setor.ativo ?? null     // $5
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


module.exports = { createSetor, selectSetor, updateSetor };
