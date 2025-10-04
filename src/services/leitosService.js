// src/services/leitosService.js
const { pool } = require('../config/db');

async function createLeitoporCodigo(leito = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!leito?.codigo_leito) {
      throw new Error('codigo_leito é obrigatório.');
    }

    const codigo = cleanCodigo(leito.codigo_leito);

    // 1) Tenta achar leito por código
    let jaExiste = await client.query(
      'SELECT * FROM leitos WHERE codigo_leito = $1 LIMIT 1',
      [codigo]
    );

    if (jaExiste.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Leito já cadastrado.',
        leito: jaExiste.rows[0],
      };
    }

    // 2) Cria leito
    const inserido = await client.query(
      `INSERT INTO leitos (codigo_leito, id_setor, andar, sala, descricao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        codigo,
        leito.id_setor,
        leito.andar ?? null,
        leito.sala ?? null,
        leito.descricao ?? null,
      ]
    );

    await client.query('COMMIT');
    return inserido.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const cleanCodigo = (c) => String(c || '').trim();

/**
 * Lê 1 leito pelo código
 */
async function getLeitoPorCodigo(codigo_leito) {
  const codigo = cleanCodigo(codigo_leito);
  if (!codigo) throw new Error('codigo_leito é obrigatório.');

  const { rows } = await pool.query(
    `SELECT * FROM leitos
     WHERE codigo_leito = $1
     LIMIT 1`,
    [codigo]
  );

  if (rows.length === 0) return null;
  return rows[0];
}

async function updateLeitoPorCodigo(codigo_leito, dados = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const codigo = cleanCodigo(codigo_leito);
    if (!codigo) throw new Error('codigo_leito é obrigatório.');

    const {
      andar = null,
      sala = null,
      id_setor = null,
      descricao = null,
    } = dados;

    const { rows } = await client.query(
      `UPDATE leitos
         SET andar     =  COALESCE($1, andar)
             sala      =  COALESCE($2, sala)
             id_setor  =  COALESCE($3, id_setor)
             descricao =  COALESVE($4, descricao)
       WHERE codigo_leito = $5
       RETURNING *`,
      [andar, sala, id_setor, descricao, codigo]
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

/**
 * (Opcional) Deleta um leito pelo código — completa o CRUD mantendo a mesma linha de simplicidade.
 */
async function deleteLeitoPorCodigo(codigo_leito) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const codigo = cleanCodigo(codigo_leito);
    if (!codigo) throw new Error('codigo_leito é obrigatório.');

    const { rows } = await client.query(
      `DELETE FROM leitos
       WHERE codigo_leito = $1
       RETURNING *`,
      [codigo]
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

module.exports = {
  createLeitoporCodigo,
  getLeitoPorCodigo,
  updateLeitoPorCodigo,
  deleteLeitoPorCodigo, // opcional
};
