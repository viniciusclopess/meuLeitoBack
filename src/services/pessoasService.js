// src/services/leitosService.js
const { pool } = require('../db/pool');

async function createPessoa(pessoa = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!pessoa?.cpf || !pessoa?.nome || !pessoa?.nascimento) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = String(pessoa.cpf).replace(/\D/g, '');

    // 1) Buscar pessoa por CPF
    const rPessoa = await client.query(
      'SELECT id FROM pessoas WHERE cpf = $1',
      [cpfLimpo]
    );
    pessoaDados = null
    // Não achou = Cria
    if (rPessoa.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO pessoas (cpf, nome, nascimento, telefone, sexo, estado_civil, naturalidade, nacionalidade, uf, endereco, email )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          cpfLimpo,
          pessoa.nome,
          pessoa.nascimento,
          pessoa.telefone ?? null,
          pessoa.sexo,
          pessoa.estado_civil ?? null,
          pessoa.naturalidade ?? null, 
          pessoa.nacionalidade ?? null, 
          pessoa.uf ?? null,
          pessoa.endereco ?? null,
          pessoa.email ?? null
        ]
      );
      pessoaDados = r.rows[0];
    } else {
      pessoaDados = rPessoa.rows[0];
    }

    await client.query('COMMIT');
    return pessoaDados;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get de 1 usuário
async function selectPessoa(cpf) {
  if (!cpf) throw new Error('CPF é obrigatório.');

  const { rows } = await pool.query(
    `SELECT * FROM pessoas
     WHERE cpf = $1
     LIMIT 1`,
    [cpf]
  );

  if (rows.length === 0) return null;
  return rows[0];
}

async function updatePessoa(pessoa = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Verifica se há login na requisição
    if (!pessoa?.cpf) throw new Error('Login obrigatório.');

    // 2) Faz o update dos dados da requisição
    // obs: Tipo Usuário deve seguir -> 'admin', 'enfermeira', 'medico' ou 'paciente'
    const { rows } = await client.query(
      `UPDATE usuarios
        SET nome            =  COALESCE($2, nome),
            nascimento      =  COALESCE($3, nascimento),
            telefone        =  COALESCE($4, telefone),
            sexo            =  COALESCE($5, sexo),
            estado_civil    =  COALESCE($6, estado_civil),
            naturalidade    =  COALESCE($7, naturalidade),
            nacionalidade   =  COALESCE($8, nacionalidade),
            uf              =  COALESCE($9, uf),
            endereco        =  COALESCE($10, endereco),
            email           =  COALESCE($11, email)
        WHERE cpf = $1
        RETURNING *`,
      [
        pessoa.cpf, pessoa.nome, pessoa.nascimento, pessoa.telefone, pessoa.sexo, pessoa.estado_civil, 
        pessoa.naturalidade, pessoa.nacionalidade, pessoa.uf, pessoa.endereco, pessoa.email]
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

module.exports = { createPessoa, selectPessoa, updatePessoa };
