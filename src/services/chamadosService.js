const { pool } = require('../db/pool');

async function insertChamado({ id_paciente_leito, prioridade, mensagem }) {
  const client = await pool.connect();

  if (!id_paciente_leito) {
    throw new Error("Campos obrigatórios! (id_paciente_leito)");
  }

  const tipoDefault = "OUTROS";

  try {
    await client.query("BEGIN");

    const rChamado = await client.query(
      `
      INSERT INTO "Chamados" (
        "IdPacienteLeito",
        "IdProfissional",
        "Prioridade",
        "Tipo",
        "Mensagem"
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        id_paciente_leito,
        null, // começa sem profissional
        prioridade ?? null,
        tipoDefault, // 👈 nunca vai null agora
        mensagem ?? null,
      ]
    );

    await client.query("COMMIT");
    return rChamado.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar chamado:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function selectChamado(id_paciente_leito, id_profissional, id_paciente, id_leito, id_setor, status) {
  let query = `
  SELECT 
    "Chamados"."Id",
    "PacienteLeito"."Id"            AS "IdPacienteLeito",
    "Pacientes"."Id"                AS "IdPaciente",
    "Pacientes"."Nome"              AS "Paciente",
    "Leitos"."Id"                   AS "IdLeito",
    "Leitos"."Nome"                 AS "Leito",
    "Setores"."Id"                  AS "IdSetor",
    "Setores"."Nome"                AS "Setor",
    "Profissionais"."Id"            AS "IdProfissional",
    "Profissionais"."Nome"          AS "Profissional",
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
  INNER JOIN "Setores"
    ON "Setores"."Id" = "Leitos"."IdSetor" 
  `;

  const params = [];
  let paramIndex = 1;  // Inicializa o índice de parâmetro

  if (id_paciente_leito) {
    query += ` WHERE "Chamados"."IdPacienteLeito" = $${paramIndex}`;
    params.push(id_paciente_leito);
    paramIndex++;
  }

  if (id_profissional) {
    if (params.length > 0) {
      query += ` AND "Chamados"."IdProfissional" = $${paramIndex}`;
    } else {
      query += ` WHERE "Chamados"."IdProfissional" = $${paramIndex}`;
    }
    params.push(id_profissional);
    paramIndex++;
  }

  if (id_paciente) {
    if (params.length > 0) {
      query += ` AND "Pacientes"."Id" = $${paramIndex}`;
    } else {
      query += ` WHERE "Pacientes"."Id" = $${paramIndex}`;
    }
    params.push(id_paciente);
    paramIndex++;
  }

  if (id_leito) {
    if (params.length > 0) {
      query += ` AND "Leitos"."Id" = $${paramIndex}`;
    } else {
      query += ` WHERE "Leitos"."Id" = $${paramIndex}`;
    }
    params.push(id_leito);
    paramIndex++;
  }

  if (id_setor) {
    if (params.length > 0) {
      query += ` AND "Setores"."Id" = $${paramIndex}`;
    } else {
      query += ` WHERE "Setores"."Id" = $${paramIndex}`;
    }
    params.push(id_setor);
    paramIndex++;
  }

  if (status) {
    if (params.length > 0) {
      query += ` AND "Chamados"."Status" = $${paramIndex}`;
    } else {
      query += ` WHERE "Chamados"."Status" = $${paramIndex}`;
    }
    params.push(status);
    paramIndex++;
  }

  query += ' ORDER BY "Chamados"."DataCriacao" DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

async function selectUltimoChamado(id_paciente_leito, id_profissional, id_paciente, id_leito, id_setor) {
  let query = `
  SELECT 
    "Chamados"."Id"                 AS "chamadoId",
    "PacienteLeito"."Id"            AS "pacienteLeitoId",
    "Pacientes"."Id"                AS "pacienteId",
    "Pacientes"."Nome"              AS "nomePaciente",
    "Leitos"."Id"                   AS "leitoId",
    "Leitos"."Nome"                 AS "nomeLeito",
    "Setores"."Id"                  AS "setorId",
    "Setores"."Nome"                AS "nomeSetor",
    "Profissionais"."Id"            AS "profissionalId",
    "Profissionais"."Nome"          AS "nomeProfissional",
    "Chamados"."Status"             AS "status",
    "Chamados"."Tipo"               AS "tipo",
    "Chamados"."Prioridade"         AS "prioridade",
    "Chamados"."Mensagem"           AS "mensagem",
    "Chamados"."DataCriacao"        AS "hora",
    "Chamados"."DataFim"            AS "horaFim"
  FROM "Chamados"
  INNER JOIN "PacienteLeito" 
    ON "Chamados"."IdPacienteLeito" = "PacienteLeito"."Id"
  INNER JOIN "Pacientes"
    ON "PacienteLeito"."IdPaciente" = "Pacientes"."Id"
  LEFT JOIN "Profissionais"
    ON "Chamados"."IdProfissional" = "Profissionais"."Id"
  INNER JOIN "Leitos"
    ON "PacienteLeito"."IdLeito" = "Leitos"."Id"
  INNER JOIN "Setores"
    ON "Setores"."Id" = "Leitos"."IdSetor" 
  `;

  const params = [];
  let paramIndex = 1;

  // Filtros opcionais
  if (id_paciente_leito) {
    query += ` WHERE "Chamados"."IdPacienteLeito" = $${paramIndex++}`;
    params.push(id_paciente_leito);
  }

  if (id_profissional) {
    query += params.length ? ` AND "Chamados"."IdProfissional" = $${paramIndex++}` : ` WHERE "Chamados"."IdProfissional" = $${paramIndex++}`;
    params.push(id_profissional);
  }

  if (id_paciente) {
    query += params.length ? ` AND "Pacientes"."Id" = $${paramIndex++}` : ` WHERE "Pacientes"."Id" = $${paramIndex++}`;
    params.push(id_paciente);
  }

  if (id_leito) {
    query += params.length ? ` AND "Leitos"."Id" = $${paramIndex++}` : ` WHERE "Leitos"."Id" = $${paramIndex++}`;
    params.push(id_leito);
  }

  if (id_setor) {
    query += params.length ? ` AND "Setores"."Id" = $${paramIndex++}` : ` WHERE "Setores"."Id" = $${paramIndex++}`;
    params.push(id_setor);
  }

  query += ' ORDER BY "Chamados"."DataCriacao" DESC LIMIT 1';

  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}

async function selectChamadosPendentes(id_setor) {

  let query = `
  SELECT 
    "Chamados"."Id"                 AS "chamadoId",
    "PacienteLeito"."Id"            AS "pacienteLeitoId",
    "Pacientes"."Nome"              AS "nomePaciente",
    "Leitos"."Nome"                 AS "nomeLeito",
    "Setores"."Id"                  AS "setorId",
    "Chamados"."Status"             AS "status",
    "Chamados"."Tipo"               AS "tipo",
    "Chamados"."Prioridade"         AS "prioridade",
    "Chamados"."Mensagem"           AS "mensagem",
    "Chamados"."DataCriacao"        AS "hora",
    "Chamados"."DataFim"            AS "horaFim"
  FROM "Chamados"
  INNER JOIN "PacienteLeito" 
    ON "Chamados"."IdPacienteLeito" = "PacienteLeito"."Id"
  INNER JOIN "Pacientes"
    ON "PacienteLeito"."IdPaciente" = "Pacientes"."Id"
  LEFT JOIN "Profissionais"
    ON "Chamados"."IdProfissional" = "Profissionais"."Id"
  INNER JOIN "Leitos"
    ON "PacienteLeito"."IdLeito" = "Leitos"."Id"
  INNER JOIN "Setores"
    ON "Setores"."Id" = "Leitos"."IdSetor"
  WHERE 
    "Chamados"."Status" = 'PENDENTE'
  `;

  if(id_setor){
    query += ` AND "Setores"."Id" = ${id_setor}`
  }
  query += ' ORDER BY "Chamados"."DataCriacao" DESC';

  const { rows } = await pool.query(query);
  return rows;
}

async function acceptChamado({ id_chamado, id_profissional }) {
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
       SET "Status"     = 'CONCLUIDO',
           "DataFim"    = NOW()
     WHERE "Id"         = $1
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

module.exports = { insertChamado, selectUltimoChamado, selectChamado, selectChamadosPendentes, acceptChamado, finishChamado }