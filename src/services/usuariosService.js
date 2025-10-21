// src/services/leitosService.js
const { pool } = require('../db/pool');
const bcrypt = require('bcrypt');

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function insertUsuario(usuario = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!usuario?.cpf) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = cleanCpf(usuario.cpf);

    // 1) Buscar usuario por CPF
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
          usuario.nome,
          usuario.nascimento,
          usuario.telefone ?? null,
          usuario.sexo,
          usuario.estado_civil ?? null,
          usuario.naturalidade ?? null, 
          usuario.nacionalidade ?? null, 
          usuario.uf ?? null,
          usuario.endereco ?? null,
          usuario.email ?? null
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
    if (!usuario?.senha || !usuario?.role) {
      throw new Error('Campos obrigatórios para criação de usuário!');
    }

    // 3) Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(usuario.senha, saltRounds);

    // 4) Inserir usuário
    const rUsuario = await client.query(
      `INSERT INTO usuarios (id_pessoa, login, senha, role, ativo)
       VALUES ( $1, $2, $3, $4, $5)
       RETURNING *`,
      [
        pessoaId,
        usuario.cpf,
        senhaHash,
        usuario.role,
        usuario.ativo ?? true
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

// Get de usuários
async function selectUsuario(nome) {
  let query = 
  `SELECT 
      usu.id              AS id_usuario,
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
      usu.login           AS login,
      usu.role            AS role,
      usu.ativo           AS ativo
      FROM usuarios usu
    INNER JOIN pessoas p ON p.id = usu.id_pessoa`;
  const params = [];
  if (nome) {
    query += ' WHERE p.nome ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updateUsuario(usuario = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!usuario?.login) throw new Error('Login obrigatório.');

    senhaHash = null
    if (usuario?.senha){
      const saltRounds = 10;
      senhaHash = await bcrypt.hash(usuario.senha, saltRounds);
    }

    // obs: Tipo Usuário deve seguir -> 'admin', 'gestor', 'comum'
    const { rows } = await client.query(
      `UPDATE usuarios
        SET senha              =  COALESCE($2, senha),
            role               =  COALESCE($3, role),
            ativo              =  COALESCE($4, ativo)
        WHERE login = $1
        RETURNING *`,
      [
        usuario.login,
        senhaHash, 
        usuario.role, 
        usuario.ativo
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

async function removeUsuario(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID da enfermeira é obrigatório.');

    const result = await client.query(
      `DELETE FROM usuarios 
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
module.exports = { insertUsuario, selectUsuario, updateUsuario, removeUsuario };