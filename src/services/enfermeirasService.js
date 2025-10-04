const { pool } = require('../config/db');

/**
 * Regras:
 *  1) Se existir CPF e já houver pessoa com esse CPF, reutiliza.
 *  2) Se não existir pessoa, cria nova.
 *  3) Se já for enfermeiras (pessoa_id já em médicos), retorna aviso.
 */
async function createEnfermeiraComPessoa(pessoa = {}, enfermeira = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!pessoa?.cpf || !enfermeira?.codigo_setor) {
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
      `INSERT INTO enfermeiras (id_pessoa, id_setor, status, obs)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        pessoaId,
        setorId,
        enfermeira.status ?? null,
        enfermeira.obs ?? null
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

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function getEnfermeiraPorCPF(cpf) {
  const cpfClean = cleanCpf(cpf);
  if (!cpfClean) throw new Error('CPF é obrigatório.');

  const { rows } = await pool.query(
    `SELECT 
       p.nome,
       p.cpf,
       p.nascimento,
       p.sexo,
       p.telefone,
       enf.id              AS id_enfermeira,
       enf.setor,
       enf.status,
       enf.obs
     FROM pessoas p
     INNER JOIN enfermeiras enf ON enf.id_pessoa = p.id
     WHERE p.cpf = $1
     LIMIT 1`,
    [cpfClean]
  );

  if (rows.length === 0) return null;

  return rows[0];
}

async function updateEnfermeiraPorCPF(cpf, enfermeira = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1) Verifica se há CPF na requisição
    const cpfClean = cleanCpf(cpf);
    if (!cpfClean) throw new Error('CPF é obrigatório.');

    // 2) Faz o update dos dados da requisição
    const { rows } = await client.query(
      `UPDATE enfermeiras enf
      SET 
          id_setor        =  COALESCE($2, ativo)
          status          =  COALESCE($3, senha),
          obs             =  COALESCE($4, tipo_usuario),
      FROM pessoas p
      WHERE enf.id_pessoa = p.id
        AND p.cpf = $1
      RETURNING enf.*`,
      [cpfClean, enfermeira.id_setor, enfermeira.status, enfermeira.obs]
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

module.exports = { createEnfermeiraComPessoa, getEnfermeiraPorCPF, updateEnfermeiraPorCPF };