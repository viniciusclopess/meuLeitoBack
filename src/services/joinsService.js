const { pool } = require('../db/pool');

async function insertPacienteLeito(id_paciente, id_leito){
  const client = await pool.connect();
  try{
    await client.query('BEGIN');

    if(!id_paciente || !id_leito) throw new Error('Campos obrigatórios.')

    const rVerificacao = await client.query(
      `
      SELECT 
        "Id",
        "Status"
      FROM "Leitos"
      WHERE
      "Id" = $1, 
      "Status" = <> 'Livre'
      `
      [
        id_leito
      ]
    )
    if(rVerificacao.rowCount > 0){
      await client.query('ROLLBACK');
      return {
        warning: 'Esse leito está indisponível!',
        pacienteLeitoId: rVerificacao.rows[0].Id
      };
    }
    const rNovo = await client.query(
        `INSERT INTO "PacienteLeito" ("IdPaciente", "IdLeito")
        VALUES ($1, $2)
        RETURNING "Id"`,
        [
          id_paciente,
          id_leito
        ]
    );
    await client.query('COMMIT');
    return{
      ok: true,
      pacienteLeito: rNovo.rows[0]
    } 
  } catch (err) {
      await client.query('ROLLBACK');
      throw err;
  } finally {
      client.release();
  }
}


async function selectPacienteLeito(nome) {
  let query = 
  `SELECT 
      "Pacientes"."Nome",
      "Leitos"."Nome",
      "PacienteLeito"."DataEntrada",
      "PacienteLeito"."DataSaida"
    FROM "PacienteLeito"
    INNER JOIN "Pacientes" 
      ON "PacienteLeito"."IdPaciente" = "Pacientes"."Id"
    INNER JOIN 
      ON "PacienteLeito"."IdLeito" = "Leitos"."Id"
    `;
  const params = [];
  if (nome) {
    query += 
    ` WHERE 
        "PacienteLeito"."IdPaciente" = "Pacientes"."Id",
        "PacienteLeito"."IdLeito"    = "Leitos"."Id",
        "Pacientes"."Nome"           ILIKE $1,
        "Leitos"."Status"            = 'Ocupado';                  
    `;
    params.push(`%${nome}%`);
  }
  const { rSelectLeitosOcupados } = await pool.query(query, params);
  return rSelectLeitosOcupados;
}

async function updatePacienteLeito(id, paciente_leito) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (!id) throw new Error('Id é obrigatório.');

    const { rUpdate } = await client.query(
      `UPDATE "PacienteLeito"
        SET 
          "IdPaciente"        = COALESCE($2, "PacienteLeito"."IdPaciente"),
          "IdLeito"           = COALESCE($3, "PacienteLeito"."IdLeito"),
          "DataEntrada"       = COALESCE($4, "PacienteLeito"."DataEntrada"),
          "DataSaida"         = COALESCE($5, "PacienteLeito"."DataSaida"),
          "Leitos"."Status"   = COALESCE($6, "Leitos"."Status")
        FROM "Leitos"
        WHERE
          "PacienteLeito"."IdLeito" = "Leitos"."Id"
          AND "PacienteLeito"."Id" = $1
        RETURNING 
          "PacienteLeito"."Id",
          "PacienteLeito"."IdPaciente",
          "PacienteLeito"."IdLeito",
          "PacienteLeito"."DataEntrada",
          "PacienteLeito"."DataSaida",
          "Leitos"."Status";
      `
      [
        id, 
        paciente_leito.id_paciente ?? null, 
        paciente_leito.id_leito ?? null, 
        paciente_leito.data_entrada ?? null, 
        paciente_leito.data_saida ?? null
      ]
    );

    await client.query('COMMIT');
    if (rUpdate.length === 0) return null;
    return rUpdate[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { insertPacienteLeito, selectPacienteLeito, updatePacienteLeito };