// src/services/leitosService.js
const { pool } = require('../db/pool');
const bcrypt = require('bcrypt');

async function createUsuario(pessoa = {}, usuario = {}) {
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
          pessoa.sexo,
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
    if (!usuario?.senha_hash || !usuario?.role) {
      throw new Error('Campos obrigatórios para criação de usuário!');
    }

    // 3) Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(usuario.senha_hash, saltRounds);

    // 4) Inserir usuário
    const rUsuario = await client.query(
      `INSERT INTO usuarios (id_pessoa, login, senha_hash, role, ativo)
       VALUES (
        $1, 
        (SELECT cpf FROM pessoas WHERE id = $1), 
        $2, 
        $3, 
        $4)
       RETURNING *`,
      [
        pessoaId,
        senhaHash,
        usuario.role,
        usuario.ativo ?? 1
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
async function selectUsuario(login) {
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
       usu.role,
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

async function updateUsuario(usuario = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Verifica se há login na requisição
    if (!usuario?.login) throw new Error('Login obrigatório.');
    
    // Se senha for trocada
    senhaHash = null
    if (usuario?.senha_hash){
      const saltRounds = 10;
      senhaHash = await bcrypt.hash(usuario.senha_hash, saltRounds);
    }

    // 2) Faz o update dos dados da requisição
    // obs: Tipo Usuário deve seguir -> 'admin', 'enfermeira', 'medico' ou 'paciente'
    const { rows } = await client.query(
      `UPDATE usuarios
        SET senha_hash         =  COALESCE($1, senha_hash),
            role               =  COALESCE($2, role),
            ativo              =  COALESCE($3, ativo)
        WHERE login = $4
        RETURNING *`,
      [
        senhaHash, 
        usuario.role, 
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

module.exports = { createUsuario, selectUsuario, updateUsuario };