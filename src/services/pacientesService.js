const { pool } = require('../db/pool');

const cleanCpf = (cpf) => (cpf || '').replace(/\D/g, '');

async function insertPaciente(paciente) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!paciente?.cpf || !paciente?.nome || !paciente?.nascimento || !paciente?.sexo) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = cleanCpf(paciente.cpf)

    // 1) Buscar paciente por CPF
    const rPaciente = await client.query(
      'SELECT "Id" FROM "Pacientes" WHERE "Cpf" = $1',
      [cpfLimpo]
    );
    if (rPaciente.rowCount > 0) {
      await client.query('ROLLBACK');
      return {
        warning: 'Esse paciente já foi cadastrado anteriormente!',
        pacienteId: rPaciente.rows[0].Id
      };
    }

    const rNovo = await client.query(
      `INSERT INTO "Pacientes" ("Cpf", "Nome", "Nascimento", "Sexo", "Telefone", "Altura", "Peso", "TipoSanguineo", "Rotina")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING "Id"`,
      [
        cpfLimpo,
        paciente.nome,
        paciente.nascimento,
        paciente.sexo,
        paciente.telefone ?? null,
        paciente.altura ?? null,
        paciente.peso ?? null,
        paciente.tipo_sanguineo ?? null,
        paciente.rotina ?? null
      ]
    );
    await client.query('COMMIT');
    return{
      ok: true,
      paciente: rNovo.rows[0]
    } 
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function selectPaciente(nome) {
  let query = 
  `SELECT 
      *
    FROM "Pacientes"`;
  const params = [];
  if (nome) {
    query += ' WHERE "Pacientes"."Nome" ILIKE $1';
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePaciente(id, paciente) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (!id) throw new Error('Id do paciente é obrigatório.');

    const { rows } = await client.query(
      `UPDATE "Pacientes"
        SET 
          "Cpf"             =  COALESCE($2, "Cpf"),
          "Nome"            =  COALESCE($3, "Nome"),
          "Nascimento"      =  COALESCE($4, "Nascimento"),
          "Sexo"            =  COALESCE($5, "Sexo"),
          "Telefone"        =  COALESCE($6, "Telefone"),
          "Altura"          =  COALESCE($7, "Altura"),
          "Peso"            =  COALESCE($8, "Peso"),
          "TipoSanguineo"   =  COALESCE($9, "TipoSanguineo"),
          "Rotina"          =  COALESCE($10, "Rotina")
        WHERE "Id" = $1
      RETURNING *`,
      [
        id, 
        paciente.cpf ?? null, 
        paciente.nome ?? null, 
        paciente.nascimento ?? null, 
        paciente.sexo ?? null, 
        paciente.telefone ?? null,
        paciente.altura ?? null,
        paciente.peso ?? null,
        paciente.tipo_sanguineo ?? null,
        paciente.rotina ?? null
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

async function removePaciente(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID do paciente é obrigatório.');

    const result = await client.query(
      `DELETE FROM "Pacientes" 
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
      throw new Error('Não foi possível excluir: há registros relacionados a este paciente.');
    }

    throw err;
  } finally {
    client.release();
  }
}
module.exports = { insertPaciente, selectPaciente, updatePaciente, removePaciente };