const { pool } = require('../db/pool');

/**
 * Regras:
 *  1) Se existir CPF e já houver pessoa com esse CPF, reutiliza.
 *  2) Se não existir pessoa, cria nova.
 *  3) Se já for paciente (pessoa_id já em pacientes), retorna aviso.
 */
async function createPaciente(pessoa = {}, paciente = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!pessoa?.cpf) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = String(pessoa.cpf).replace(/\D/g, '');

    // 1) Buscar pessoa por CPF
    const rPessoa = await client.query(
      'SELECT id FROM pessoas WHERE cpf = $1',
      [cpfLimpo]
    );

    let pessoaId;
    // Não achou = Cria
    if (rPessoa.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO pessoas (cpf, nome, nascimento, telefone, sexo, estado_civil, naturalidade, nacionalidade, uf, endereco, email )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          cpfLimpo,
          pessoa.nome,
          pessoa.nascimento,
          pessoa.telefone ?? null,
          pessoa.sexo ?? null,
          pessoa.estado_civil ?? null,
          pessoa.naturalidade ?? null, 
          pessoa.nacionalidade ?? null, 
          pessoa.uf ?? null,
          pessoa.endereco ?? null,
          pessoa.email ?? null
        ]
      );
      pessoaId = r.rows[0].id;
    } else {
      pessoaId = rPessoa.rows[0].id;
    }

    // 2) Já é paciente?
    const jaExiste = await client.query(
      'SELECT id FROM pacientes WHERE id_pessoa = $1',
      [pessoaId]
    );
    if (jaExiste.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Pessoa já possui cadastro de paciente.',
        pessoa_id: pessoaId,
        pac_id: jaExiste.rows[0].id
      };
    }    

    // 4) Inserir paciente
    const rPaciente = await client.query(
      `INSERT INTO pacientes (id_pessoa, alergias, comorbidades, prontuario, observacao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        pessoaId,
        paciente.alergias ?? null,
        paciente.comorbidades ?? null,
        paciente.prontuario ?? null,
        paciente.observacao ?? null
      ]
    );

    await client.query('COMMIT');
    return rPaciente.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function selectPaciente(cpf) {
  const cpfClean = cleanCpf(cpf);
  if (!cpfClean) throw new Error('CPF é obrigatório.');

  const { rows } = await pool.query(
    `SELECT 
       p.nome,
       p.cpf,
       p.nascimento,
       p.sexo,
       p.telefone,
       pa.id              AS paciente_id,
       pa.alergias,
       pa.comorbidades,
       pa.prontuario,
       pa.observacao
     FROM pessoas p
     INNER JOIN pacientes pa ON pa.id_pessoa = p.id
     WHERE p.cpf = $1
     LIMIT 1`,
    [cpfClean]
  );

  if (rows.length === 0) return null;

  return rows[0];
}

async function updatePaciente(cpf, paciente = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1) Verifica se há CPF na requisição
    if (!cpf) throw new Error('CPF obrigatório.');
    const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

    // 2) Faz o update dos dados da requisição
    const { rows } = await client.query(
      `UPDATE pacientes pac
      SET 
          alergias        =  COALESCE($2, alergias)
          comorbidades    =  COALESCE($3, comorbidades),
          prontuario      =  COALESCE($4, prontuario),
          observacao      =  COALESCE($5, observacao),
      FROM pessoas p
      WHERE pac.id_pessoa = p.id
        AND p.cpf = $1
      RETURNING pac.*`,
      [cleanCpf, paciente.alergias, paciente.comorbidades, paciente.prontuario, paciente.observacao]
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

module.exports = { createPaciente, selectPaciente, updatePaciente };