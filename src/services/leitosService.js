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

/**
 * Lê 1 leito pelo código
 */
async function getLeitoPorCodigo(codigo_leito) {
  if (!codigo_leito) throw new Error('codigo_leito é obrigatório.');

  const { rows } = await pool.query(
    `SELECT * FROM leitos
     WHERE codigo_leito = $1
     LIMIT 1`,
    [codigo_leito]
  );

  if (rows.length === 0) return null;
  return rows[0];
}

async function updateLeitoPorCodigo(codigo_leito, leito = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!codigo_leito) throw new Error('codigo_leito é obrigatório.');
    
    const novoCodigo = leito.novo_codigo_leito ?? null;

    const { rows } = await client.query(
      `UPDATE leitos
         SET 
            codigo_leito   =  COALESCE($2, codigo_leito),
            andar          =  COALESCE($3, andar),
            sala           =  COALESCE($4, sala),
            id_setor       =  COALESCE($5, id_setor),
            descricao      =  COALESVE($6, descricao)
       WHERE codigo_leito = $1
       RETURNING *`,
      [
        codigo_leito, 
        novoCodigo, 
        leito.andar, 
        leito.sala, 
        leito.id_setor, 
        leito.descricao]
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
  updateLeitoPorCodigo
};
