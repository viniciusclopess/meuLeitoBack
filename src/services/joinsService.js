const { pool } = require('../db/pool');

async function insertPacienteLeito(alocacao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!alocacao?.id_paciente || !alocacao?.id_leito) {
      throw new Error('Campos obrigatórios.');
    }

    const rVerificacao = await client.query(
      `
      SELECT 
        "Id",
        "Status"
      FROM "Leitos"
      WHERE
        "Id" = $1
        AND "Status" = 'Livre'
      `,
      [alocacao.id_leito]
    );

    if (rVerificacao.rowCount === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        warning: 'Esse leito está indisponível.'
      };
    }

    const rNovo = await client.query(
      `
      INSERT INTO "PacienteLeito" ("IdPaciente", "IdLeito")
      VALUES ($1, $2)
      RETURNING "Id", "IdPaciente", "IdLeito"
      `,
      [
        alocacao.id_paciente,
        alocacao.id_leito
      ]
    );

    // 4. marcar o leito como Ocupado
    await client.query(
      `
      UPDATE "Leitos"
      SET "Status" = 'Ocupado'
      WHERE "Id" = $1
      `,
      [alocacao.id_leito]
    );

    // 5. commit final
    await client.query('COMMIT');

    return {
      ok: true,
      pacienteLeito: rNovo.rows[0]
    };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro em alocacao:', err.message);
    throw err;
  } finally {
    client.release();
  }
}



async function selectPacienteLeito(nome) {
  let query = 
  `SELECT 
      "Pacientes"."Nome" AS "NomePaciente",
      "Leitos"."Nome" AS "NomeLeito",
      "PacienteLeito"."DataEntrada",
      "PacienteLeito"."DataSaida"
    FROM "PacienteLeito"
    INNER JOIN "Pacientes" 
      ON "PacienteLeito"."IdPaciente" = "Pacientes"."Id"
    INNER JOIN "Leitos"
      ON "PacienteLeito"."IdLeito" = "Leitos"."Id"
    `;
  const params = [];
  if (nome) {
    query += 
    ` WHERE 
        "PacienteLeito"."IdPaciente"      = "Pacientes"."Id"
        AND "PacienteLeito"."IdLeito"     = "Leitos"."Id" 
        AND "Pacientes"."Nome"            ILIKE $1
        AND "Leitos"."Status"             = 'Ocupado'
        AND "PacienteLeito"."DataSaida"   IS NULL                  
    `;
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePacienteLeito(id, alocacao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('Id é obrigatório.');

    const rUpdateAlocacao = `
      UPDATE "PacienteLeito"
      SET 
        "IdPaciente"  = COALESCE($2, "PacienteLeito"."IdPaciente"),
        "IdLeito"     = COALESCE($3, "PacienteLeito"."IdLeito"),
        "DataEntrada" = COALESCE($4, "PacienteLeito"."DataEntrada"),
        "DataSaida"   = COALESCE($5, "PacienteLeito"."DataSaida")
      WHERE "PacienteLeito"."Id" = $1
      RETURNING 
        "Id",
        "IdPaciente",
        "IdLeito",
        "DataEntrada",
        "DataSaida"
    `;

    const paramsAlocacao = [
      id,
      alocacao.id_paciente ?? null,
      alocacao.id_leito ?? null,
      alocacao.data_entrada ?? null,
      alocacao.data_saida ?? null
    ];

    const { rows: alocacaoRows } = await client.query(rUpdateAlocacao, paramsAlocacao);

    if (alocacaoRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const leitoFinalId = alocacaoRows[0].IdLeito;

    if (alocacao.status != null) {
      const rUpdateLeito = `
        UPDATE "Leitos"
        SET "Status" = $2
        WHERE "Id" = $1
        RETURNING "Id", "Nome", "Status"
      `;

      const paramsLeito = [
        leitoFinalId,
        alocacao.status
      ];

      await client.query(rUpdateLeito, paramsLeito);
    }

    const selectSQL = `
      SELECT 
        "PacienteLeito"."Id"            AS "AlocacaoId",
        "Pacientes"."Nome"              AS "PacienteNome",
        "Leitos"."Nome"                 AS "LeitoNome",
        "Leitos"."Status"               AS "LeitoStatus",
        "PacienteLeito"."DataEntrada",
        "PacienteLeito"."DataSaida"
      FROM "PacienteLeito"
      INNER JOIN "Pacientes"
        ON "PacienteLeito"."IdPaciente" = "Pacientes"."Id"
      INNER JOIN "Leitos"
        ON "PacienteLeito"."IdLeito" = "Leitos"."Id"
      WHERE "PacienteLeito"."Id" = $1
    `;

    const { rows: finalRows } = await client.query(selectSQL, [id]);

    await client.query('COMMIT');
    return finalRows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { 
  insertPacienteLeito, selectPacienteLeito, updatePacienteLeito,
  

};