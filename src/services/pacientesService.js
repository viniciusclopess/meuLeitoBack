const { pool } = require('../db/pool');

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function insertPaciente(paciente = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!paciente?.cpf) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = cleanCpf(paciente.cpf)

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
          paciente.nome,
          paciente.nascimento,
          paciente.telefone ?? null,
          paciente.sexo,
          paciente.estado_civil ?? null,
          paciente.naturalidade ?? null, 
          paciente.nacionalidade ?? null, 
          paciente.uf ?? null,
          paciente.endereco ?? null,
          paciente.email ?? null
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
      `INSERT INTO pacientes (id_pessoa, alergias, comorbidades, prontuario, observacao, rotinas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        pessoaId,
        paciente.alergias ?? null,
        paciente.comorbidades ?? null,
        paciente.prontuario ?? null,
        paciente.observacao ?? null,
        paciente.rotinas ?? null
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

// Get de pacientes
async function selectPaciente(nome) {
  let query = 
  `SELECT 
      pac.id              AS id_paciente,
      p.id                AS id_pessoa,
      p.nome              AS nome,
      p.cpf               AS cpf,
      p.sexo              AS sexo,
      p.nascimento        AS nascimento,
      p.telefone          AS telefone,
      p.estado_civil      AS estado_civil,
      p.naturalidade      AS naturalidade,
      p.nacionalidade     AS nacionalidade,
      p.uf                AS uf,
      p.endereco          AS endereco,
      p.email             AS email,
      pac.rotinas         AS rotinas,
      pac.alergias        AS alergias,
      pac.comorbidades    AS comorbidades,
      pac.prontuario      AS prontuario,
      pac.observacao      AS observacao
      FROM pacientes pac
    INNER JOIN pessoas p ON p.id = pac.id_pessoa`;
  const params = [];
  if (nome) {
    query += ' WHERE p.nome ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePaciente(paciente = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (!paciente.id) throw new Error('Id obrigatório.');

    const { rows } = await client.query(
      `UPDATE pacientes
        SET 
          alergias        =  COALESCE($2, alergias),
          comorbidades    =  COALESCE($3, comorbidades),
          prontuario      =  COALESCE($4, prontuario),
          observacao      =  COALESCE($5, observacao),
          rotinas         =  COALESCE($6, rotinas)
        WHERE id = $1
      RETURNING *`,
      [paciente.id, paciente.alergias, paciente.comorbidades, paciente.prontuario, paciente.observacao, paciente.rotinas]
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

async function removePaciente(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID do paciente é obrigatório.');

    const result = await client.query(
      `DELETE FROM pacientes 
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) return null;
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    // Tratamento para violação de integridade (FK)
    if (err.code === '23503') {
      throw new Error(
        'Não foi possível excluir: há registros relacionados a esta enfermeira.'
      );
    }

    throw err;
  } finally {
    client.release();
  }
}
module.exports = { insertPaciente, selectPaciente, updatePaciente, removePaciente };