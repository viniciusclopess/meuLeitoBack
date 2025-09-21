const { pool } = require('../config/db');

/**
 * Regras:
 *  1) Se existir CPF e já houver pessoa com esse CPF, reutiliza.
 *  2) Se não existir pessoa, cria nova.
 *  3) Se já for médico (pessoa_id já em médicos), retorna aviso.
 */
async function createMedicoComPessoa(pessoa = {}, medico = {}) {
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

    // 3) Já é medico?
    const jaPac = await client.query('SELECT id FROM medicos WHERE id_pessoa = $1', [pessoaId]);
    if (jaPac.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Pessoa já possui cadastro de médico.',
        pessoa_id: pessoaId,
        medico_id: jaPac.rows[0].id
      };
    }

    // 4) Cria medico
    const novoPac = await client.query(
      `INSERT INTO medicos (id_pessoa, especialidade, status, obs)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [pessoaId, medico.especialidade ?? null, medico.status ?? null, medico.obs ?? null]
    );

    await client.query('COMMIT');
    return { pessoa_id: pessoaId, medico: novoPac.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function getMedicoPorCPF(cpf) {
  const cpfClean = cleanCpf(cpf);
  if (!cpfClean) throw new Error('CPF é obrigatório.');

  const { rows } = await pool.query(
    `SELECT 
       p.nome,
       p.cpf,
       p.nascimento,
       p.sexo,
       p.telefone,
       me.id              AS id_medico,
       me.especialidade,
       me.status,
       me.obs
     FROM pessoas p
     INNER JOIN medicos me ON me.id_pessoa = p.id
     WHERE p.cpf = $1
     LIMIT 1`,
    [cpfClean]
  );

  if (rows.length === 0) return null;

  return rows[0];
}

async function updateMedicoPorCPF(cpf, medico = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { especialidade = null, status = null, obs = null } = medico;

    const { rows } = await client.query(
      `UPDATE medicos me
       SET especialidade = $1,
           status = $2,
           obs = $3
       FROM pessoas p
       WHERE me.id_pessoa = p.id
         AND p.cpf = $4
       RETURNING me.*`,
      [especialidade, status, obs, cpf]
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

module.exports = { createMedicoComPessoa, getMedicoPorCPF, updateMedicoPorCPF };