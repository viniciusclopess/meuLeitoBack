const { pool } = require('../config/db');

async function createChamado(chamado = {}){
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const rChamado = await client.query(
        `INSERT INTO chamados (id_paciente, id_leito, id_setor, categoria, mensagem, status)
        VALUES (
            $1, 
            $2, 
            (SELECT id_setor FROM leitos WHERE id = $2), 
            $3,
            $4, 
            'pendente'
        ) RETURNING *;`, 
        [
            chamado.id_paciente,
            chamado.id_leito,
            chamado.categoria,
            chamado.mensagem ?? null
        ]);

        await client.query('COMMIT');
        return rChamado.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar chamado:', err);
        throw err;
    } finally {
        client.release();
    }
}
/**
 * Lista chamados por setor e status (ex.: pendente)
 */
async function listarPorSetorEStatus(idSetor, status = 'pendente') {
  const { rows } = await pool.query(
    `SELECT * FROM chamados
      WHERE id_setor = $1 AND status = $2
      ORDER BY criado_em ASC`,
    [idSetor, status]
  );
  return rows;
}

/**
 * Aceitar chamado (enfermeira):
 * só se estiver pendente e sem enfermeira
 */
async function aceitarChamado(id_chamado, id_enfermeira) {
  const { rows, rowCount } = await pool.query(
    `UPDATE chamados
       SET id_enfermeira = $2,
           status        = 'em_atendimento',
           respondido_em = NOW()
     WHERE id = $1
       AND status = 'pendente'
       AND id_enfermeira IS NULL
     RETURNING *`,
    [id_chamado, id_enfermeira]
  );
  return rowCount ? rows[0] : null;
}

/**
 * Finalizar chamado:
 * só a mesma enfermeira e status em_atendimento
 */
async function finalizarChamado(id_chamado, id_enfermeira) {
  const { rows, rowCount } = await pool.query(
    `UPDATE chamados
       SET status = 'respondido'
     WHERE id = $1
       AND status = 'em_atendimento'
       AND id_enfermeira = $2
     RETURNING *`,
    [id_chamado, id_enfermeira]
  );
  return rowCount ? rows[0] : null;
}


module.exports = { createChamado, listarPorSetorEStatus, aceitarChamado, finalizarChamado }
