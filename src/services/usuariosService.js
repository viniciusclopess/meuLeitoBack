// src/services/leitosService.js
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

async function createUsuarioPorCPF(pessoa = {}, usuario = {}) {
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

    // 2) Já é usuário?
    const jaExiste = await client.query(
      'SELECT id FROM usuarios WHERE id_pessoa = $1',
      [pessoaId]
    );
    if (jaExiste.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Pessoa já possui cadastro de usuário.',
        pessoa_id: pessoaId,
        user_id: jaExiste.rows[0].id
      };
    }

    // Verificação de campos
    if (!usuario?.senha || !usuario?.tipo_usuario) {
      throw new Error('Campos obrigatórios para criação de usuário!');
    }

    // 3) Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);

    // 4) Inserir usuário
    const rUsuario = await client.query(
      `INSERT INTO usuarios (id_pessoa, login, senha, tipo_usuario, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        pessoaId,
        cpfLimpo,                // login = CPF
        senhaHash,               // senha com hash
        usuario.tipo_usuario,
        usuario.ativo ?? 1      // padrão: ativo = 1
      ]
    );

    await client.query('COMMIT');
    return rUsuario.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Get de 1 usuário
async function getUsuarioPorLogin(login) {
  if (!login) throw new Error('Login é obrigatório.');

  const { rows } = await pool.query(
    `SELECT 
       p.nome,
       p.cpf,
       p.nascimento,
       p.sexo,
       p.telefone,
       usu.id              AS id_usuario,
       usu.login,
       usu.tipo_usuario,
       usu.ativo,
       usu.ultimo_login
     FROM pessoas p
     INNER JOIN usuarios usu ON usu.id_pessoa = p.id
     WHERE usu.login = $1
     LIMIT 1`,
    [login]
  );

  if (rows.length === 0) return null;
  return rows[0];
}

async function updateUsuarioPorLogin(usuario = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Verifica se há login na requisição
    if (!usuario?.login) throw new Error('Login obrigatório.');
    
    // Se senha for trocada
    senhaHash = null
    if (usuario?.senha){
      const saltRounds = 10;
      senhaHash = await bcrypt.hash(usuario.senha, saltRounds);
    }

    // 2) Faz o update dos dados da requisição
    // obs: Tipo Usuário deve seguir -> 'admin', 'enfermeira', 'medico' ou 'paciente'
    const { rows } = await client.query(
      `UPDATE usuarios
        SET senha         =  COALESCE($1, senha),
            tipo_usuario  =  COALESCE($2, tipo_usuario),
            ativo         =  COALESCE($3, ativo)
        WHERE login = $4
        RETURNING *`,
      [
        senhaHash, 
        usuario.tipo_usuario, 
        usuario.ativo, 
        usuario.login]
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

module.exports = {
  createUsuarioPorCPF,
  getUsuarioPorLogin,
  updateUsuarioPorLogin
};
