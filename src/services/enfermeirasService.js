const { pool } = require('../db/pool');

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function insertEnfermeira(enfermeira = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!enfermeira?.cpf || !enfermeira?.codigo_setor) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = cleanCpf(enfermeira.cpf)

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
          enfermeira.nome,
          enfermeira.nascimento,
          enfermeira.telefone ?? null,
          enfermeira.sexo,
          enfermeira.estado_civil ?? null,
          enfermeira.naturalidade ?? null, 
          enfermeira.nacionalidade ?? null, 
          enfermeira.uf ?? null,
          enfermeira.endereco ?? null,
          enfermeira.email ?? null
        ]
      );
      pessoaId = r.rows[0].id;
    } else {
      pessoaId = rPessoa.rows[0].id;
    }

    // 2) Já é enfermeira?
    const jaExiste = await client.query(
      'SELECT id FROM enfermeiras WHERE id_pessoa = $1',
      [pessoaId]
    );
    if (jaExiste.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Pessoa já possui cadastro de enfermeira.',
        pessoa_id: pessoaId,
        enf_id: jaExiste.rows[0].id
      };
    }    

    // 3) Buscar setor
    let codSetor = enfermeira.codigo_setor
    const rSetor = await client.query(
      'SELECT id FROM setores WHERE codigo_setor = $1',
      [codSetor]
    );
    if(rSetor.rowCount === 0){
      throw new Error('O setor a ser inserido não existe!'); 
    } else{
        setorId = rSetor.rows[0].id;
    }

    // 4) Inserir enfermeira
    const rEnfermeira = await client.query(
      `INSERT INTO enfermeiras (id_pessoa, id_setor, especialidade, ativo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        pessoaId,
        setorId,
        enfermeira.especialidade ?? null,
        enfermeira.ativo ?? true
      ]
    );

    await client.query('COMMIT');
    return rEnfermeira.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function selectEnfermeira(nome) {
  let query = 
  `SELECT 
      enf.id              AS id_enfermeira,
      p.id                AS id_pessoa,
      enf.id_setor        AS id_setor,
      p.nome              AS nome,
      p.cpf               AS cpf,
      p.sexo              AS sexo,
      p.nascimento        AS nascimento,
      enf.especialidade   AS especialidade,
      p.telefone          AS telefone,
      p.estado_civil      AS estado_civil,
      p.naturalidade      AS naturalidade,
      p.nacionalidade     AS nacionalidade,
      p.uf                AS uf,
      p.endereco          AS endereco,
      p.email             AS email,
      enf.ativo           AS ativo
      FROM enfermeiras enf
    INNER JOIN pessoas p ON p.id = enf.id_pessoa
  `;
  const params = [];
  if (nome) {
    query += ' WHERE p.nome ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updateEnfermeira(enfermeira = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!enfermeira.id) throw new Error('Id é obrigatório.');

    const { rows } = await client.query(
      `UPDATE enfermeiras
          SET id_setor      = COALESCE($2, id_setor),
              especialidade = COALESCE($3, especialidade),
              ativo         = COALESCE($4, ativo)
        WHERE id = $1
      RETURNING *`,
      [
        enfermeira.id,
        enfermeira.id_setor ?? null,
        enfermeira.especialidade ?? null,
        enfermeira.ativo ?? null
      ]
    );

    await client.query('COMMIT');
    if (rows.length === 0) return null; // não encontrou o id
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function removeEnfermeira(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID da enfermeira é obrigatório.');

    const result = await client.query(
      `DELETE FROM enfermeiras 
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



module.exports = { insertEnfermeira, selectEnfermeira, updateEnfermeira, removeEnfermeira };