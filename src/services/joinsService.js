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
    console.error('Erro em alocação:', err.message);
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

//==================================================================================================================================
//==================================================================================================================================

async function insertProfissionalPermissao(permissao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!permissao?.id_profissional || !permissao?.id_permissao) {
      throw new Error('Campos obrigatórios.');
    }

    const rVerificacao = await client.query(
      `
      SELECT 
        "Id"
      FROM "Permissoes"
      WHERE
        "Id" = $1
      `,
      [permissao.id_permissao]
    );

    if (rVerificacao.rowCount === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        warning: 'Essa permissão está indisponível.'
      };
    }

    const rNovo = await client.query(
      `
      INSERT INTO "ProfissionalPermissao" ("IdProfissional", "IdPermissao")
      VALUES ($1, $2)
      RETURNING *
      `,
      [
        permissao.id_profissional,
        permissao.id_permissao
      ]
    );
    await client.query('COMMIT');

    return {
      ok: true,
      profissionalPermissao: rNovo.rows[0]
    };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro em permissão:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function selectProfissionalPermissao(nome) {
  let query = 
  `SELECT
      "ProfissionalPermissao"."Id",
      "Profissionais"."Nome" AS "Nome",
      "Profissionais"."Cpf" AS "Login",
      "Permissoes"."Nome" AS "Permissao"
    FROM "ProfissionalPermissao"
    INNER JOIN "Profissionais" 
      ON "ProfissionalPermissao"."IdProfissional" = "Profissionais"."Id"
    INNER JOIN "Permissoes"
      ON "ProfissionalPermissao"."IdPermissao" = "Permissoes"."Id"
    `;
  const params = [];
  if (nome) {
    query += 
    ` WHERE 
        "Profissionais"."Nome" ILIKE $1               
    `;
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updateProfissionalPermissao(id, permissao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('Id é obrigatório.');

    const rUpdatePermissao = `
      UPDATE "ProfissionalPermissao"
      SET 
        "IdProfissional"  = COALESCE($2, "ProfissionalPermissao"."IdProfissional"),
        "IdPermissao"     = COALESCE($3, "ProfissionalPermissao"."IdPermissao")
      WHERE "ProfissionalPermissao"."Id" = $1
      RETURNING 
        *
    `;

    const paramsPermissao = [
      id,
      permissao.id_profissional ?? null,
      permissao.id_permissao ?? null
    ];

    const { rows: permissaoRows } = await client.query(rUpdatePermissao, paramsPermissao);

    if (permissaoRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return permissaoRows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function removeProfissionalPermissao(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID de controle da permissão é obrigatório.');

    const result = await client.query(
      `DELETE FROM "ProfissionalPermissao" 
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

//==================================================================================================================================
//==================================================================================================================================

async function insertProfissionaisSetores(setorizacao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!setorizacao?.id_profissional || !setorizacao?.id_setor) {
      throw new Error('Campos obrigatórios.');
    }

    const rVerificacao = await client.query(
      `
      SELECT 
        "Id"
      FROM "Setores"
      WHERE
        "Id" = $1
      `,
      [setorizacao.id_setor]
    );

    if (rVerificacao.rowCount === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        warning: 'Esse setor está indisponível.'
      };
    }

    const rNovo = await client.query(
      `
      INSERT INTO "ProfissionaisSetores" ("IdProfissional", "IdSetor")
      VALUES ($1, $2)
      RETURNING *
      `,
      [
        setorizacao.id_profissional,
        setorizacao.id_setor
      ]
    );
    await client.query('COMMIT');

    return {
      ok: true,
      profissionalSetor: rNovo.rows[0]
    };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro em setorização:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function selectProfissionaisSetores(nome) {
  let query = 
  `SELECT
      "ProfissionaisSetores"."Id",
      "Profissionais"."Nome" AS "Profissional",
      "Profissionais"."Cpf",
      "Setores"."Nome" AS "Setor"
    FROM "ProfissionaisSetores"
    INNER JOIN "Profissionais" 
      ON "ProfissionaisSetores"."IdProfissional" = "Profissionais"."Id"
    INNER JOIN "Setores"
      ON "ProfissionaisSetores"."IdSetor" = "Setores"."Id"
    `;
  const params = [];
  if (nome) {
    query += 
    ` WHERE 
        "Profissionais"."Nome" ILIKE $1               
    `;
    params.push(`%${nome}%`);
  }
  const { rows } = await pool.query(query, params);
  return rows;
}

async function updateProfissionaisSetores(id, setorizacao) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('Id é obrigatório.');

    const rUpdateSetorizacao = `
      UPDATE "ProfissionaisSetores"
      SET 
        "IdProfissional"  = COALESCE($2, "ProfissionaisSetores"."IdProfissional"),
        "IdSetor"         = COALESCE($3, "ProfissionaisSetores"."IdSetor")
      WHERE "ProfissionaisSetores"."Id" = $1
      RETURNING 
        *
    `;

    const paramsSetorizacao = [
      id,
      setorizacao.id_profissional ?? null,
      setorizacao.id_setor ?? null
    ];

    const { rows: setorizacaoRows } = await client.query(rUpdateSetorizacao, paramsSetorizacao);

    if (setorizacaoRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return setorizacaoRows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function removeProfissionaisSetores(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID de setorização é obrigatório.');

    const result = await client.query(
      `DELETE FROM "ProfissionaisSetores" 
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

//==================================================================================================================================
//==================================================================================================================================

async function insertPacienteAlergia(alergia) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!alergia?.id_paciente || !alergia?.id_alergia) {
      throw new Error('Campos obrigatórios.');
    }

    // Verificar se a alergia existe / está ativa
    const rVerificacao = await client.query(
      `
      SELECT "Id"
      FROM "Alergias"
      WHERE "Id" = $1
        AND "Ativo" = TRUE
      `,
      [alergia.id_alergia]
    );

    if (rVerificacao.rowCount === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        warning: 'Essa alergia está indisponível ou inativa.'
      };
    }

    // Inserir relação paciente ↔ alergia
    const rNovo = await client.query(
      `
      INSERT INTO "PacienteAlergia" (
        "IdPaciente",
        "IdAlergia"
      )
      VALUES ($1, $2)
      RETURNING *
      `,
      [
        alergia.id_paciente,
        alergia.id_alergia
      ]
    );

    await client.query('COMMIT');

    return {
      ok: true,
      pacienteAlergia: rNovo.rows[0]
    };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro em paciente/alergia:', err.message);

    // Se violou UNIQUE (mesma alergia já cadastrada p/ esse paciente)
    if (err.code === '23505') {
      return {
        ok: false,
        warning: 'Esse paciente já está marcado com essa alergia.'
      };
    }

    throw err;
  } finally {
    client.release();
  }
}

async function selectPacienteAlergia(nome) {
  let query = `
    SELECT
      "PacienteAlergia"."Id",
      "Pacientes"."Nome"  AS "Paciente",
      "Pacientes"."CPF",
      "Alergias"."Nome"   AS "Alergia",
      "PacienteAlergia"."DataRegistro"
    FROM "PacienteAlergia"
    INNER JOIN "Pacientes"
      ON "PacienteAlergia"."IdPaciente" = "Pacientes"."Id"
    INNER JOIN "Alergias"
      ON "PacienteAlergia"."IdAlergia" = "Alergias"."Id"
  `;

  const params = [];

  if (nome) {
    query += `
      WHERE "Pacientes"."Nome" ILIKE $1
    `;
    params.push(`%${nome}%`);
  }

  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePacienteAlergia(id, alergia) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('Id é obrigatório.');

    const sqlUpdate = `
      UPDATE "PacienteAlergia"
      SET 
        "IdPaciente" = COALESCE($2, "PacienteAlergia"."IdPaciente"),
        "IdAlergia"  = COALESCE($3, "PacienteAlergia"."IdAlergia")
      WHERE "PacienteAlergia"."Id" = $1
      RETURNING *
    `;

    const paramsUpdate = [
      id,
      alergia.id_paciente ?? null,
      alergia.id_alergia ?? null,
      alergia.observacao ?? null
    ];

    const { rows: alergiaRows } = await client.query(sqlUpdate, paramsUpdate);

    if (alergiaRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return alergiaRows[0];

  } catch (err) {
    await client.query('ROLLBACK');

    // 23505 = violação de UNIQUE (mesma alergia duplicada p/ mesmo paciente)
    if (err.code === '23505') {
      throw new Error('Esse paciente já possui essa alergia registrada.');
    }

    throw err;
  } finally {
    client.release();
  }
}

async function removePacienteAlergia(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID de relação paciente/alergia é obrigatório.');

    const result = await client.query(
      `
      DELETE FROM "PacienteAlergia" 
      WHERE "Id" = $1
      RETURNING *
      `,
      [id]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) return null;
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23503') {
      throw new Error('Não foi possível excluir: existem registros vinculados a essa alergia do paciente.');
    }

    throw err;
  } finally {
    client.release();
  }
}

//==================================================================================================================================
//==================================================================================================================================

async function insertPacienteComorbidade(comorbidade) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!comorbidade?.id_paciente || !comorbidade?.id_comorbidade) {
      throw new Error('Campos obrigatórios.');
    }

    // Verificar se a comorbidade existe / está ativa
    const rVerificacao = await client.query(
      `
      SELECT "Id"
      FROM "Comorbidades"
      WHERE "Id" = $1
        AND "Ativo" = TRUE
      `,
      [comorbidade.id_comorbidade]
    );

    if (rVerificacao.rowCount === 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        warning: 'Essa comorbidade está indisponível ou inativa.'
      };
    }

    // Inserir relação paciente ↔ comorbidade
    const rNovo = await client.query(
      `
      INSERT INTO "PacienteComorbidade" (
        "IdPaciente",
        "IdComorbidade"
      )
      VALUES ($1, $2)
      RETURNING *
      `,
      [
        comorbidade.id_paciente,
        comorbidade.id_comorbidade
      ]
    );

    await client.query('COMMIT');

    return {
      ok: true,
      pacienteComorbidade: rNovo.rows[0]
    };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro em paciente/comorbidade:', err.message);

    // Se violou UNIQUE (mesma comorbidade já cadastrada p/ esse paciente)
    if (err.code === '23505') {
      return {
        ok: false,
        warning: 'Esse paciente já está marcado com essa comorbidade.'
      };
    }

    throw err;
  } finally {
    client.release();
  }
}

async function selectPacienteComorbidade(nome) {
  let query = `
    SELECT
      "PacienteComorbidade"."Id",
      "Pacientes"."Nome"  AS "Paciente",
      "Pacientes"."CPF",
      "Comorbidades"."Nome"   AS "Comorbidade",
      "PacienteComorbidade"."DataRegistro"
    FROM "PacienteComorbidade"
    INNER JOIN "Pacientes"
      ON "PacienteComorbidade"."IdPaciente" = "Pacientes"."Id"
    INNER JOIN "Comorbidades"
      ON "PacienteComorbidade"."IdComorbidade" = "Comorbidades"."Id"
  `;

  const params = [];

  if (nome) {
    query += `
      WHERE "Pacientes"."Nome" ILIKE $1
    `;
    params.push(`%${nome}%`);
  }

  const { rows } = await pool.query(query, params);
  return rows;
}

async function updatePacienteComorbidade(id, comorbidade) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('Id é obrigatório.');

    const sqlUpdate = `
      UPDATE "PacienteComorbidade"
      SET 
        "IdPaciente"      = COALESCE($2, "PacienteComorbidade"."IdPaciente"),
        "IdComorbidade"   = COALESCE($3, "PacienteComorbidade"."IdComorbidade")
      WHERE "PacienteComorbidade"."Id" = $1
      RETURNING *
    `;

    const paramsUpdate = [
      id,
      comorbidade.id_paciente ?? null,
      comorbidade.id_comorbidade ?? null,
      comorbidade.observacao ?? null
    ];

    const { rows: comorbidadeRows } = await client.query(sqlUpdate, paramsUpdate);

    if (comorbidadeRows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return comorbidadeRows[0];

  } catch (err) {
    await client.query('ROLLBACK');

    // 23505 = violação de UNIQUE (mesma comorbidade duplicada p/ mesmo paciente)
    if (err.code === '23505') {
      throw new Error('Esse paciente já possui essa comorbidade registrada.');
    }

    throw err;
  } finally {
    client.release();
  }
}

async function removePacienteComorbidade(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('ID de relação paciente/comorbidade é obrigatório.');

    const result = await client.query(
      `
      DELETE FROM "PacienteComorbidade" 
      WHERE "Id" = $1
      RETURNING *
      `,
      [id]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) return null;
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23503') {
      throw new Error('Não foi possível excluir: existem registros vinculados a essa comorbidade do paciente.');
    }

    throw err;
  } finally {
    client.release();
  }
}
module.exports = { 
  insertPacienteLeito, selectPacienteLeito, updatePacienteLeito,
  insertProfissionalPermissao, selectProfissionalPermissao, updateProfissionalPermissao, removeProfissionalPermissao,
  insertProfissionaisSetores, selectProfissionaisSetores, updateProfissionaisSetores, removeProfissionaisSetores,
  insertPacienteAlergia, selectPacienteAlergia, updatePacienteAlergia, removePacienteAlergia,
  insertPacienteComorbidade, selectPacienteComorbidade, updatePacienteComorbidade, removePacienteComorbidade
};