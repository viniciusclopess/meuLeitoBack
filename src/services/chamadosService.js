const { pool } = require('../db/pool');

async function insertChamado(chamado){
    const client = await pool.connect();
    if(!chamado.id_paciente_leito){
      throw new Error("Campos obrigatórios!")
    }
    try {
        await client.query('BEGIN');
        const rChamado = await client.query(
        `INSERT INTO "Chamados" ("IdPacienteLeito", "IdProfissional", "Prioridade", "Tipo", "Mensagem")
        VALUES ( $1, $2, $3, $4, $5 ) 
        RETURNING *;`, 
        [
            chamado.id_paciente_leito,
            chamado.id_profissional,
            chamado.prioridade ?? null,
            chamado.tipo ?? null,
            chamado.mensagem ?? null
        ]);

        await client.query('COMMIT');
        return rChamado.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar chamado:', err);
        throw err;
    } finally {
        client.release();
    }
}

async function selectChamado(id_paciente_leito, id_profissional, id_paciente, id_leito, status) {
  let query = `
  SELECT 
    "Chamados"."Id",
    "PacienteLeito"."Id" AS "IdPacienteLeito",
    "Pacientes"."Id" AS "IdPaciente",
    "Pacientes"."Nome" AS "Paciente",
    "Leitos"."Id" AS "IdLeito",
    "Leitos"."Nome" AS "Leito",
    "Profissionais"."Nome" AS "Profissional",
    "Chamados"."Status",
    "Chamados"."Tipo",
    "Chamados"."Prioridade",
    "Chamados"."Mensagem",
    "Chamados"."DataCriacao",
    "Chamados"."DataFim"
  FROM "Chamados"
  INNER JOIN "PacienteLeito" 
    ON "Chamados"."IdPacienteLeito" = "PacienteLeito"."Id"
  INNER JOIN "Pacientes"
    ON "PacienteLeito"."IdPaciente" = "Pacientes"."Id"
  LEFT JOIN "Profissionais"
    ON "Chamados"."IdProfissional" = "Profissionais"."Id"
  INNER JOIN "Leitos"
    ON "PacienteLeito"."IdLeito" = "Leitos"."Id"
`;

  const params = [];

  if (id_paciente_leito) {
    query += ` WHERE "Chamados"."IdPacienteLeito" = $1`;
    params.push(id_paciente_leito);
  }

  if (id_profissional) {
    if (params.length > 0) {
      query += ` AND "Chamados"."IdProfissional" = $2`;
    } else {
      query += ` WHERE "Chamados"."IdProfissional" = $2`;
    }
    params.push(id_profissional);
  }
  
  if (id_paciente) {
    if (params.length > 0) {
      query += ` AND "Pacientes"."Id" = $3`;
    } else {
      query += ` WHERE "Pacientes"."Id" = $3`;
    }
    params.push(id_paciente);
  }
  
  if (id_leito) {
    if (params.length > 0) {
      query += ` AND "Leitos"."Id" = $4`;
    } else {
      query += ` WHERE "Leitos"."Id" = $4`;
    }
    params.push(id_leito);
  }

  if (status) {
    if (params.length > 0) {
      query += ` AND "Chamados"."Status" = $5`;
    } else {
      query += ` WHERE "Chamados"."Status" = $5`;
    }
    params.push(status);
  }

  query += ' ORDER BY "Chamados"."DataCriacao" DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

async function acceptChamado(id_chamado, id_profissional) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id_chamado || !id_profissional) throw new Error('Id é obrigatório.');

    const sqlUpdate = `
      UPDATE "Chamados"
        SET "IdProfissional" = $2,
            "Status"         = 'EM ATENDIMENTO'
      WHERE "Id" = $1
      RETURNING *
    `;

    const paramsUpdate = [
      id_chamado, 
      id_profissional
    ];

    const { rows: acceptChamadoRows } = await client.query(sqlUpdate, paramsUpdate);

    if (acceptChamadoRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return acceptChamadoRows[0];

  } catch (err) {
    await client.query('ROLLBACK');

    throw err;
  } finally {
    client.release();
  }
}

async function finishChamado(id_chamado) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id_chamado) throw new Error('Id é obrigatório.');

    const sqlUpdate = `
      UPDATE "Chamados"
       SET "Status" = 'CONCLUÍDO',
           "DataFim" = NOW()
     WHERE "Id" = $1
       AND "Status" = 'EM ATENDIMENTO'
     RETURNING *
    `;

    const paramsUpdate = [
      id_chamado
    ];

    const { rows: finishChamadoRows } = await client.query(sqlUpdate, paramsUpdate);

    if (finishChamadoRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return finishChamadoRows[0];

  } catch (err) {
    await client.query('ROLLBACK');

    throw err;
  } finally {
    client.release();
  }
}
module.exports = { insertChamado, selectChamado, acceptChamado, finishChamado }