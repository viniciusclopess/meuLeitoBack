// src/services/leitosService.js
const { pool } = require('../db/pool');

async function createLeito(leito = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!leito?.codigo_leito) {
      throw new Error('codigo_leito é obrigatório.');
    }

    const codigoLeito = cleanCodigo(leito.codigo_leito);

    // 1) Tenta achar leito por código
    let jaExiste = await client.query(
      'SELECT * FROM leitos WHERE codigo_leito = $1 LIMIT 1',
      [codigoLeito]
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
      `INSERT INTO leitos (codigo_leito, id_setor, id_paciente, status, descricao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        codigoLeito,
        leito.id_setor,
        leito.id_paciente ?? null,
        leito.status ?? 'livre',
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
async function selectLeito(codigo_leito) {
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

async function updateLeito(codigo_leito, leito = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!codigo_leito) throw new Error('Código do leito é obrigatório.');
    
    const novoCodigo = leito.novo_codigo_leito ?? null;

    const { rows } = await client.query(
      `UPDATE leitos
         SET 
            codigo_leito   =  COALESCE($2, codigo_leito),
            id_setor       =  COALESCE($3, id_setor),
            id_paciente    =  COALESCE($4, id_paciente),
            status         =  COALESCE($5, status),
            descricao      =  COALESVE($6, descricao)
       WHERE codigo_leito = $1
       RETURNING *`,
      [
        codigo_leito, 
        novoCodigo, 
        leito.id_setor,
        leito.id_paciente,
        leito.status,
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
  createLeito,
  selectLeito,
  updateLeito
};
