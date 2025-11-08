const { pool } = require('../db/pool');

const cleanCPF = (cpf) => (cpf || '').replace(/\D/g, '');

async function insertPaciente(paciente) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!paciente?.cpf || !paciente?.nome || !paciente?.nascimento || !paciente?.sexo) {
      throw new Error('Campos obrigatórios!');
    }

    // Ajeitar CPF
    const cpfLimpo = cleanCPF(paciente.cpf)

    // 1) Buscar paciente por CPF
    const rPaciente = await client.query(
      'SELECT "Id" FROM "Pacientes" WHERE "CPF" = $1',
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
      `INSERT INTO "Pacientes" ("CPF", "Nome", "Nascimento", "Sexo", "Telefone", "Altura", "Peso", "TipoSanguineo")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        cpfLimpo,
        paciente.nome,
        paciente.nascimento,
        paciente.sexo,
        paciente.telefone ?? null,
        paciente.altura ?? null,
        paciente.peso ?? null,
        paciente.tipo_sanguineo ?? null
      ]
    );
    await client.query('COMMIT');
    return {
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

/**
 * selectPaciente - paginação por OFFSET com total
 * @param {Object} opts
 *   - nome: string (opcional) -> filtro ILIKE
 *   - page: 1-based page number (default 1)
 *   - pageSize: number (default 25, max 200)
 * @returns {Promise<{ data: Array, total: number, page: number, pageSize: number, totalPages: number }>}
 */
async function selectPaciente({ nome, page = 1, pageSize = 25 } = {}) {
  // validação / limites
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.min(200, Math.max(1, Number(pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const params = [];
  let where = "";

  if (nome) {
    params.push(`%${nome}%`);
    where = `WHERE p."Nome" ILIKE $${params.length}`;
  }

  const sql = `
    SELECT
      p.*,
      COUNT(*) OVER() AS __total_count
    FROM "Pacientes" p
    ${where}
    ORDER BY p."Nome" ASC, p."Id" ASC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  params.push(pageSize, offset);

  const { rows } = await pool.query(sql, params);

  const total = rows.length ? Number(rows[0].__total_count) : 0;
  const data = rows.map(({ __total_count, ...r }) => r);

  return {
    data,
    total,
    page,
    pageSize
  };
}

async function updatePaciente(id, paciente) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!id) throw new Error('Id do paciente é obrigatório.');

    const { rows } = await client.query(
      `UPDATE "Pacientes"
        SET 
          "CPF"             =  COALESCE($2, "CPF"),
          "Nome"            =  COALESCE($3, "Nome"),
          "Nascimento"      =  COALESCE($4, "Nascimento"),
          "Sexo"            =  COALESCE($5, "Sexo"),
          "Telefone"        =  COALESCE($6, "Telefone"),
          "Altura"          =  COALESCE($7, "Altura"),
          "Peso"            =  COALESCE($8, "Peso"),
          "TipoSanguineo"   =  COALESCE($9, "TipoSanguineo")
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
        paciente.tipo_sanguineo ?? null
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