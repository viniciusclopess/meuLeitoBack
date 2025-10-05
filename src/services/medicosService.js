const { pool } = require('../config/db');

/**
 * Regras:
 *  1) Se existir CPF e já houver pessoa com esse CPF, reutiliza.
 *  2) Se não existir pessoa, cria nova.
 *  3) Se já for médico (pessoa_id já em médicos), retorna aviso.
 */
async function createMedico(pessoa = {}, medico = {}) {
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

    // 2) Já é médico?
    const jaExiste = await client.query(
      'SELECT id FROM medicos WHERE id_pessoa = $1',
      [pessoaId]
    );
    if (jaExiste.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Pessoa já possui cadastro de medico.',
        pessoa_id: pessoaId,
        pac_id: jaExiste.rows[0].id
      };
    }    

    // 4) Inserir médico
    const rMedico = await client.query(
      `INSERT INTO medicos (id_pessoa, especialidade, status, obs)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        pessoaId,
        medico.especialidade ?? null,
        medico.status ?? null,
        medico.obs ?? null
      ]
    );

    await client.query('COMMIT');
    return rMedico.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function selectMedico(cpf) {
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

async function updateMedico(cpf, medico = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1) Verifica se há CPF na requisição
    if (!cpf) throw new Error('CPF é obrigatório.');
    const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

    // 2) Faz o update dos dados da requisição
    const { rows } = await client.query(
      `UPDATE medicos med
      SET 
          especialidade     =  COALESCE($2, especialidade)
          status            =  COALESCE($3, status),
          obs               =  COALESCE($4, obs)
      FROM pessoas p
      WHERE med.id_pessoa = p.id
        AND p.cpf = $1
      RETURNING med.*`,
      [
        cleanCpf, 
        medico.especialidade, 
        medico.status, 
        medico.obs
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

module.exports = { createMedico, selectMedico, updateMedico };