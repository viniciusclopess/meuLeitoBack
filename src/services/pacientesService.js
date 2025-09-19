const { pool } = require('../config/db');

/**
 * Regras:
 *  1) Se existir CPF e já houver pessoa com esse CPF, reutiliza.
 *  2) Se não existir pessoa, cria nova.
 *  3) Se já for paciente (pessoa_id já em pacientes), retorna aviso.
 */
async function createPacienteComPessoa(pessoa = {}, paciente = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!pessoa?.nome) {
      throw new Error('Erro aqui.');
    }

    // 1) Tenta achar pessoa por CPF (se vier CPF)
    let pessoaId = null;
    if (pessoa.cpf) {
      const r = await client.query('SELECT id FROM pessoas WHERE cpf = $1', [pessoa.cpf]);
      if (r.rowCount > 0) pessoaId = r.rows[0].id;
    }

    // 2) Se não achou, cria pessoa (com upsert por cpf, se tiver)
    if (!pessoaId) {
      if (pessoa.cpf) {
        const r = await client.query(
          `INSERT INTO pessoas (nome, cpf, nascimento, sexo, telefone)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome
           RETURNING id`,
          [pessoa.nome, pessoa.cpf, pessoa.nascimento, pessoa.sexo, pessoa.telefone ?? null]
        );
        pessoaId = r.rows[0].id;
      } else {
        const r = await client.query(
          `INSERT INTO pessoas (nome, nascimento, telefone)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [pessoa.nome, pessoa.nascimento, pessoa.telefone ?? null]
        );
        pessoaId = r.rows[0].id;
      }
    }

    // 3) Já é paciente?
    const jaPac = await client.query('SELECT id FROM pacientes WHERE id_pessoa = $1', [pessoaId]);
    if (jaPac.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Pessoa já possui cadastro de paciente.',
        pessoa_id: pessoaId,
        paciente_id: jaPac.rows[0].id
      };
    }

    // 4) Cria paciente
    const novoPac = await client.query(
      `INSERT INTO pacientes (id_pessoa, alergias, comorbidades, prontuario, observacao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [pessoaId, paciente.alergias ?? null, paciente.comorbidades  ?? null, paciente.prontuario ?? null, paciente.observacao ?? null]
    );

    await client.query('COMMIT');
    return { pessoa_id: pessoaId, paciente: novoPac.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createPacienteComPessoa };