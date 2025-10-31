const { pool } = require('../db/pool');
const bcrypt = require('bcrypt');

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function insertProfissional(profissional) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (
      !profissional?.cpf ||
      !profissional?.nome ||
      !profissional?.nascimento ||
      !profissional?.sexo ||
      !profissional?.senha ||
      !profissional?.id_perfil
    ) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = cleanCpf(profissional.cpf)
    const saltRounds = 10
    const senhaHash = await bcrypt.hash(profissional.senha, saltRounds);


    // 1) Buscar profissional por CPF
    const rProfissional = await client.query(
      'SELECT "Id" FROM "Profissionais" WHERE "Cpf" = $1',
      [cpfLimpo]
    );
    if (rProfissional.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Esse profissional já foi cadastrado anteriormente!',
        profissionalId: rProfissional.rows[0].Id
      };
    }

    const rNovo = await client.query(
      `INSERT INTO "Profissionais" ("Cpf", "Nome", "Nascimento", "Sexo", "Telefone", "Senha", "NumeroDeRegistro", "IdPerfil")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        cpfLimpo,
        profissional.nome,
        profissional.nascimento,
        profissional.sexo,
        profissional.telefone ?? null,
        senhaHash,
        profissional.numero_registro ?? null,
        profissional.id_perfil
      ]
    );

    await client.query('COMMIT');
    return {
      ok: true,
      profissional: rNovo.rows[0]
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function selectProfissional(nome) {
  let query = 
  `SELECT
      PR."Id", 
      PR."Nome", 
      PR."Cpf", 
      PR."Nascimento", 
      PR."Sexo", 
      PR."Telefone", 
      PR."NumeroDeRegistro",
      PF."Id" as "IdPerfil", 
      PF."Nome" as "Perfil",
      ARRAY_AGG(ST."Nome") AS "Setores"
    FROM "Profissionais" PR
    INNER JOIN "Perfis" PF ON PR."IdPerfil" = PF."Id"
    LEFT JOIN "ProfissionaisSetores" PS ON PR."Id" = PS."IdProfissional"
    LEFT JOIN "Setores" ST ON ST."Id" = PS."IdSetor"`;
  const params = [];
  if (nome) {
    query += ' WHERE PR."Nome" ILIKE $1';
    params.push(`%${nome}%`);
  }
  query += ' GROUP BY PR."Id", PF."Nome"';

  const { rows } = await pool.query(query, params);
  return rows;
}

async function updateProfissional(id, profissional) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('Id do profissional é obrigatório.');
    if (profissional.senha) {
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(profissional.senha, saltRounds);
    }

    const { rows } = await client.query(
      `UPDATE "Profissionais"
        SET 
          "Cpf"                 =  COALESCE($2, "Cpf"),
          "Nome"                =  COALESCE($3, "Nome"),
          "Nascimento"          =  COALESCE($4, "Nascimento"),
          "Sexo"                =  COALESCE($5, "Sexo"),
          "Telefone"            =  COALESCE($6, "Telefone"),
          "NumeroDeRegistro"    =  COALESCE($7, "NumeroDeRegistro"),
          "IdPerfil"            =  COALESCE($8, "IdPerfil")
        WHERE "Id" = $1
      RETURNING *`,
      [
        id,
        profissional.cpf ?? null,
        profissional.nome ?? null,
        profissional.nascimento ?? null,
        profissional.sexo ?? null,
        profissional.telefone ?? null,
        profissional.numero_registro ?? null,
        profissional.id_perfil ?? null
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

async function removeProfissional(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID do profissional é obrigatório.');

    const result = await client.query(
      `DELETE FROM "Profissionais" 
       WHERE "Id" = $1
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) return null;
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    // 23503 = violação de chave estrangeira (há registros dependentes)
    if (err.code === '23503') {
      throw new Error('Não foi possível excluir: há registros relacionados a este profissional.');
    }

    throw err;
  } finally {
    client.release();
  }
}
module.exports = { insertProfissional, selectProfissional, updateProfissional, removeProfissional };