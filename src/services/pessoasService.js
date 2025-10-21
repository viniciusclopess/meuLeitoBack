// src/services/leitosService.js
const { pool } = require('../db/pool');

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function createPessoa(pessoa = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!pessoa?.cpf || !pessoa?.nome || !pessoa?.nascimento || !pessoa?.sexo ) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = cleanCpf(pessoa.cpf);

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

// Get de pessoas
async function selectPessoa(nome) {
  let query = 'SELECT * FROM pessoas';
  const params = [];
  if (nome) {
    query += ' WHERE nome ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePessoa(pessoa = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!pessoa?.id) throw new Error('Login obrigatório.');

    const { rows } = await client.query(
      `UPDATE pessoas
        SET 
            cpf             =  COALESCE($1, cpf),
            nome            =  COALESCE($2, nome),
            nascimento      =  COALESCE($3, nascimento),
            telefone        =  COALESCE($4, telefone),
            sexo            =  COALESCE($5, sexo),
            estado_civil    =  COALESCE($6, estado_civil),
            naturalidade    =  COALESCE($7, naturalidade),
            nacionalidade   =  COALESCE($8, nacionalidade),
            uf              =  COALESCE($9, uf),
            endereco        =  COALESCE($10, endereco),
            email           =  COALESCE($11, email)
        WHERE id = $12
        RETURNING *`,
      [
        pessoa.cpf, pessoa.nome, pessoa.nascimento, pessoa.telefone, pessoa.sexo, pessoa.estado_civil, 
        pessoa.naturalidade, pessoa.nacionalidade, pessoa.uf, pessoa.endereco, pessoa.email, pessoa.id
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

async function removePessoa(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID da pessoa é obrigatório.');

    const result = await client.query(
      `DELETE FROM pessoas 
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
        'Não foi possível excluir: há registros relacionados a esta pessoa.'
      );
    }

    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createPessoa, selectPessoa, updatePessoa, removePessoa };
