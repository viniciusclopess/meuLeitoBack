const { pool } = require('../db/pool');

// Transformar um valor (string ou array) em um array de strings limpas.
function parseCSV(v) {
  if (!v && v !== 0) return null;
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}

// Mesmo que parseCSV, mas retorna array de números inteiros.
function parseIntsCSV(v) {
  const arr = parseCSV(v);
  if (!arr) return null;
  return arr.map(s => Number(s)).filter(n => Number.isFinite(n));
}

// Tenta converter o valor para Date, se der erro, devolve o valor padrão (fb).
function parseDateOrDefault(v, fb) {
  if (!v) return fb;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fb : d;
}

// Gerar um intervalo padrão de 7 dias para trás, caso ini e fim não venham na requisição.
function defaultRange(q = {}) {
  const now = new Date();
  const fim = parseDateOrDefault(q.fim, now); // exclusivo
  const ini = parseDateOrDefault(q.ini, new Date(fim - 7 * 864e5)); // inclusivo
  return { ini, fim };
}

async function kpiTotalChamados(filters = {}) {
  try {
    const { ini, fim } = defaultRange(filters);

    // início dos filtros -> sempre usar o range como primeiros params
    const conditions = ['c."DataCriacao" >= $1', 'c."DataCriacao" <= $2'];
    const params = [ini, fim];

    // parse dos filtros
    const id_setor = parseIntsCSV(filters.id_setor);

    // helper que adiciona array como ANY
    const pushArrayParam = (values) => {
      params.push(values);
      return params.length; // index
    };

    // se filtrar por setor, NÃO fazemos JOIN direto em Leitos/Setores aqui.
    // Em vez disso usamos EXISTS (subquery) que costuma ser mais eficiente
    // e evita duplicar linhas.
    if (id_setor && id_setor.length) {
      const idx = pushArrayParam(id_setor);
      // verifica se o chamado está ligado a um pacienteLeito cujo leito tem IdSetor IN (id_setor)
      conditions.push(
        `EXISTS (
           SELECT 1
           FROM "PacienteLeito" pl2
           JOIN "Leitos" l2 ON l2."Id" = pl2."IdLeito"
           WHERE pl2."Id" = c."IdPacienteLeito"
             AND l2."IdSetor" = ANY($${idx})
         )`
      );
    }

    // monta WHERE final
    const whereSql = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // SQL simplificado: só conta DISTINCT c.Id para evitar duplicação (se houver joins)
    const sql = `
      SELECT
        COUNT(DISTINCT c."Id") AS "total_chamados",
        COUNT( DISTINCT c."Id") FILTER (WHERE c."Status" = 'PENDENTE') AS "pendentes",
        ROUND( COUNT(DISTINCT c."Id") FILTER (WHERE c."Status" = 'PENDENTE') * 100.0 / NULLIF(COUNT(DISTINCT c."Id"), 0), 2 )                               AS "pendentes_pct",
        COUNT( DISTINCT c."Id") FILTER (WHERE c."Status" = 'EM ATENDIMENTO')                                                                                AS "aceitos",
        ROUND( COUNT(DISTINCT c."Id") FILTER (WHERE c."Status" = 'EM ATENDIMENTO') * 100.0 / NULLIF(COUNT(DISTINCT c."Id"), 0), 2 )                         AS "aceitos_pct",
        COUNT( DISTINCT c."Id") FILTER (WHERE c."Status" = 'EM ATENDIMENTO' AND "DataFim" IS NULL)                                                          AS "aceitos_sem_conclusao",
        ROUND( COUNT(DISTINCT c."Id") FILTER (WHERE c."Status" = 'EM ATENDIMENTO' AND c."DataFim" IS NULL) * 100.0 / NULLIF(COUNT(DISTINCT c."Id"), 0), 2 ) AS "aceitos_sem_conclusao_pct",
        COUNT( DISTINCT c."Id") FILTER (WHERE c."Status" = 'ENCERRADO AUTOMATICAMENTE')                                                                     AS "sem_resposta",
        ROUND( COUNT(DISTINCT c."Id") FILTER (WHERE c."Status" = 'ENCERRADO AUTOMATICAMENTE') * 100.0 / NULLIF(COUNT(DISTINCT c."Id"), 0), 2 )              AS "sem_resposta_pct",      
        COUNT( DISTINCT c."Id") FILTER (WHERE c."Status" = 'CONCLUIDO')                                                                                     AS "concluidos",
        ROUND( COUNT(DISTINCT c."Id") FILTER (WHERE c."Status" = 'CONCLUIDO') * 100.0 / NULLIF(COUNT(DISTINCT c."Id"), 0), 2 )                              AS "concluidos_pct",
        COUNT( DISTINCT c."Id") FILTER (WHERE c."Status" = 'CANCELADO')                                                                                     AS "cancelados",
        ROUND( COUNT(DISTINCT c."Id") FILTER (WHERE c."Status" = 'CANCELADO') * 100.0 / NULLIF(COUNT(DISTINCT c."Id"), 0), 2 )                              AS "cancelados_pct"      
        FROM "Chamados" c
      ${whereSql};
    `;

    const { rows } = await pool.query(sql, params);
    return rows[0] ?? { total_chamados: 0 };
  } catch (err) {
    // log detalhado para ajudar no debug de performance
    console.error("Erro em KPI's de totalizadores de chamado:", err);
    throw err;
  }
}
async function kpiTempoMedioConclusao(filters = {}) {
  try {
    const { ini, fim } = defaultRange(filters);

    const conditions = [];
    const params = [ini, fim];

    const id_setor = parseIntsCSV(filters.id_setor);

    const pushArrayParam = (values) => {
      params.push(values);
      return params.length; // index
    };

    // Filtra pelo range de criação do chamado
    conditions.push(`c."DataCriacao" BETWEEN $1 AND $2`);

    // Se filtrar pelo setor
    if (id_setor && id_setor.length) {
      const idx = pushArrayParam(id_setor);
      conditions.push(
        `EXISTS (
           SELECT 1
           FROM "PacienteLeito" pl2
           JOIN "Leitos" l2 ON l2."Id" = pl2."IdLeito"
           WHERE pl2."Id" = c."IdPacienteLeito"
             AND l2."IdSetor" = ANY($${idx})
         )`
      );
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        ROUND(
          COALESCE(
            AVG(EXTRACT(EPOCH FROM (c."DataFim" - c."DataCriacao")))
              FILTER (WHERE c."Status" = 'CONCLUIDO' AND c."DataFim" IS NOT NULL) / 60.0,
            0
          ),
          2
        ) AS avg_minutes,

        ROUND(
          COALESCE(
            AVG(EXTRACT(EPOCH FROM (c."DataFim" - c."DataCriacao")))
              FILTER (WHERE c."Status" = 'CONCLUIDO' AND c."DataFim" IS NOT NULL),
            0
          ),
          2
        ) AS avg_seconds

      FROM "Chamados" c

      ${whereSql};
    `;

    const { rows } = await pool.query(sql, params);

    return {
      avg_minutes: Number(rows[0]?.avg_minutes ?? 0),
      avg_seconds: Number(rows[0]?.avg_seconds ?? 0),
    };

  } catch (err) {
    console.error("Erro em KPI's de tempo médio:", err);
    throw err;
  }
}

async function kpiTempoMedioAtendimento(filters = {}) {
  try {
    const { ini, fim } = defaultRange(filters);

    const conditions = [];
    const params = [ini, fim];

    const id_setor = parseIntsCSV(filters.id_setor);

    const pushArrayParam = (values) => {
      params.push(values);
      return params.length; // index
    };

    // Filtra pelo range de CRIAÇÃO do chamado
    conditions.push(`c."DataCriacao" BETWEEN $1 AND $2`);

    // Se filtrar pelo setor
    if (id_setor && id_setor.length) {
      const idx = pushArrayParam(id_setor);
      conditions.push(
        `EXISTS (
           SELECT 1
           FROM "PacienteLeito" pl2
           JOIN "Leitos" l2 ON l2."Id" = pl2."IdLeito"
           WHERE pl2."Id" = c."IdPacienteLeito"
             AND l2."IdSetor" = ANY($${idx})
         )`
      );
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        -- média em minutos (apenas chamados que já têm resposta)
        ROUND(
          COALESCE(
            AVG(
              EXTRACT(EPOCH FROM (c."DataResposta" - c."DataCriacao"))
            ) FILTER (WHERE c."DataResposta" IS NOT NULL) / 60.0,
            0
          ),
          2
        ) AS avg_minutes,

        -- média em segundos (mesmo critério)
        ROUND(
          COALESCE(
            AVG(
              EXTRACT(EPOCH FROM (c."DataResposta" - c."DataCriacao"))
            ) FILTER (WHERE c."DataResposta" IS NOT NULL),
            0
          ),
          2
        ) AS avg_seconds

      FROM "Chamados" c
      ${whereSql};
    `;

    const { rows } = await pool.query(sql, params);

    return {
      avg_minutes: Number(rows[0]?.avg_minutes ?? 0),
      avg_seconds: Number(rows[0]?.avg_seconds ?? 0),
    };

  } catch (err) {
    console.error("Erro em KPI de tempo médio de atendimento:", err);
    throw err;
  }
}

async function kpiSelectChamados(filtros = {}) {
  const { nome, tipo, page = 1, pageSize = 10 } = filtros;

  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const sizeNum = Number(pageSize) > 0 ? Number(pageSize) : 10;
  const offset = (pageNum - 1) * sizeNum;

  let baseQuery = `
    FROM "Chamados" c
    INNER JOIN "Profissionais" p 
      ON c."IdProfissional" = p."Id"
    WHERE 1=1
  `;

  const params = [];

  // Filtro por nome do enfermeiro
  if (nome) {
    params.push(`%${nome}%`);
    baseQuery += ` AND p."Nome" ILIKE $${params.length} `;
  }

  // Filtro por tipo do chamado
  if (tipo) {
    params.push(tipo);
    baseQuery += ` AND c."Tipo" = $${params.length} `;
  }

  // Query para total de registros
  const countQuery = `
    SELECT COUNT(*) AS total
    ${baseQuery}
  `;

  const { rows: countRows } = await pool.query(countQuery, params);
  const total = Number(countRows[0].total);

  // Query com paginação
  const dataQuery = `
    SELECT 
      c."Id"              AS id,
      c."IdPacienteLeito" AS id_paciente_leito,
      p."Nome"            AS nome,
      p."CPF"             AS cpf,
      c."Status"          AS status,
      c."Tipo"            AS tipo,
      c."DataCriacao"     AS data_criacao,
      c."DataFim"         AS data_fim,
      c."DataResposta"    AS data_resposta
    ${baseQuery}
    ORDER BY c."DataCriacao" DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  const dataParams = [...params, sizeNum, offset];

  const { rows: data } = await pool.query(dataQuery, dataParams);

  return {
    total,
    page: pageNum,
    pageSize: sizeNum,
    data
  };
}

async function kpiVolumeAtendimentosPorIntervalo(filters = {}) {
  try {
    const params = [];
    let paramIndex = 1;
    let hasWhere = false;

    let query = `
      WITH base AS (
        SELECT
          CASE
            WHEN EXTRACT(HOUR FROM c."DataCriacao") >= 0
             AND EXTRACT(HOUR FROM c."DataCriacao") < 6 THEN '00-06'
            WHEN EXTRACT(HOUR FROM c."DataCriacao") >= 6
             AND EXTRACT(HOUR FROM c."DataCriacao") < 12 THEN '06-12'
            WHEN EXTRACT(HOUR FROM c."DataCriacao") >= 12
             AND EXTRACT(HOUR FROM c."DataCriacao") < 18 THEN '12-18'
            ELSE '18-00'
          END AS intervalo
        FROM "Chamados" c
    `;

    // --- Sempre: só chamados que já tiveram resposta (concluídos) ---
    query += ` WHERE (c."Status" = 'CONCLUIDO' OR c."Status" = 'EM ATENDIMENTO' OR c."Status" = 'ENCERRADO AUTOMATICAMENTE') `;
    hasWhere = true;

    // ----------------- Filtro de DATA (opcional) -----------------
    // Se NÃO vier ini/fim -> não filtra por data (pega todo histórico)
    const hasDateFilter = Boolean(filters.ini || filters.fim);

    if (hasDateFilter) {
      // Usa defaultRange só quando tiver pelo menos um dos dois
      const { ini, fim } = defaultRange(filters); // você já tem essa função

      if (hasWhere) {
        query += ` AND c."DataCriacao" BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      } else {
        query += ` WHERE c."DataCriacao" BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        hasWhere = true;
      }

      params.push(ini, fim);
      paramIndex += 2;
    }

    // ----------------- Filtro de SETOR (opcional) -----------------
    // Aceita múltiplos setores via CSV, ex: "1,2,3"
    const id_setor = parseIntsCSV?.(filters.id_setor) || null;

    if (id_setor && id_setor.length) {
      if (hasWhere) {
        query += ` AND EXISTS (
          SELECT 1
          FROM "PacienteLeito" pl2
          JOIN "Leitos" l2 ON l2."Id" = pl2."IdLeito"
          WHERE pl2."Id" = c."IdPacienteLeito"
            AND l2."IdSetor" = ANY($${paramIndex})
        )`;
      } else {
        query += ` WHERE EXISTS (
          SELECT 1
          FROM "PacienteLeito" pl2
          JOIN "Leitos" l2 ON l2."Id" = pl2."IdLeito"
          WHERE pl2."Id" = c."IdPacienteLeito"
            AND l2."IdSetor" = ANY($${paramIndex})
        )`;
        hasWhere = true;
      }

      params.push(id_setor); // array -> ANY($n)
      paramIndex++;
    }

    // Fecha o CTE e agrega
    query += `
      )
      SELECT
        intervalo,
        COUNT(*)::int AS total
      FROM base
      GROUP BY intervalo
      ORDER BY intervalo;
    `;

    const { rows } = await pool.query(query, params);

    // Garante que todos os intervalos apareçam
    const baseIntervals = ["00-06", "06-12", "12-18", "18-00"];
    const map = new Map(rows.map((r) => [r.intervalo, Number(r.total)]));

    const intervals = baseIntervals.map((label) => ({
      label,
      total: map.get(label) ?? 0,
    }));

    return intervals;
  } catch (err) {
    console.error("Erro em KPI de volume de atendimentos por intervalo:", err);
    throw err;
  }
}

async function kpiVolumeChamadosPorTipo(filters = {}) {
  try {
    const params = [];
    let paramIndex = 1;
    let hasWhere = false;

    let query = `
      SELECT
        c."Tipo" AS tipo,
        COUNT(*)::int AS total
      FROM "Chamados" c
    `;

    // --- Sempre: só chamados "relevantes" (mesma regra da outra KPI) ---
    query += ` WHERE (c."Status" = 'CONCLUIDO' 
                  OR c."Status" = 'EM ATENDIMENTO' 
                  OR c."Status" = 'ENCERRADO AUTOMATICAMENTE')`;
    hasWhere = true;

    // Se NÃO vier ini/fim -> não filtra por data (pega todo histórico)
    const hasDateFilter = Boolean(filters.ini || filters.fim);

    if (hasDateFilter) {
      const { ini, fim } = defaultRange(filters); // mesma função que vc já usa

      if (hasWhere) {
        query += ` AND c."DataCriacao" BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      } else {
        query += ` WHERE c."DataCriacao" BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        hasWhere = true;
      }

      params.push(ini, fim);
      paramIndex += 2;
    }

    // ----------------- Filtro de SETOR (opcional) -----------------
    // Aceita múltiplos setores via CSV, ex: "1,2,3"
    const id_setor = parseIntsCSV?.(filters.id_setor) || null;

    if (id_setor && id_setor.length) {
      if (hasWhere) {
        query += ` AND EXISTS (
          SELECT 1
          FROM "PacienteLeito" pl2
          JOIN "Leitos" l2 ON l2."Id" = pl2."IdLeito"
          WHERE pl2."Id" = c."IdPacienteLeito"
            AND l2."IdSetor" = ANY($${paramIndex})
        )`;
      } else {
        query += ` WHERE EXISTS (
          SELECT 1
          FROM "PacienteLeito" pl2
          JOIN "Leitos" l2 ON l2."Id" = pl2."IdLeito"
          WHERE pl2."Id" = c."IdPacienteLeito"
            AND l2."IdSetor" = ANY($${paramIndex})
        )`;
        hasWhere = true;
      }

      params.push(id_setor); // array -> ANY($n)
      paramIndex++;
    }

    // Agrupa por tipo de chamado
    query += `
      GROUP BY c."Tipo"
      ORDER BY total DESC, c."Tipo" ASC;
    `;

    const { rows } = await pool.query(query, params);

    // Normaliza o retorno
    const result = rows.map((r) => ({
      tipo: r.tipo,
      total: Number(r.total),
    }));

    return result;
  } catch (err) {
    console.error("Erro em KPI de volume de chamados por tipo:", err);
    throw err;
  }
}

async function kpiVolumeChamadosPorSetor(filters = {}) {
  try {
    const params = [];
    let paramIndex = 1;
    let hasWhere = false;

    let query = `
      SELECT
        l."IdSetor" AS id_setor,
        s."Nome"    AS nome_setor,
        COUNT(*)::int AS total
      FROM "Chamados" c
      JOIN "PacienteLeito" pl
        ON pl."Id" = c."IdPacienteLeito"
      JOIN "Leitos" l
        ON l."Id" = pl."IdLeito"
      JOIN "Setores" s
        ON s."Id" = l."IdSetor"
    `;

    // --- Sempre: só chamados "relevantes" ---
    query += ` WHERE (
        c."Status" = 'CONCLUIDO'
        OR c."Status" = 'EM ATENDIMENTO'
        OR c."Status" = 'ENCERRADO AUTOMATICAMENTE'
      )`;
    hasWhere = true;

    // Se NÃO vier ini/fim -> não filtra por data (pega todo histórico)
    const hasDateFilter = Boolean(filters.ini || filters.fim);

    if (hasDateFilter) {
      const { ini, fim } = defaultRange(filters); // mesma função que vc já usa

      if (hasWhere) {
        query += ` AND c."DataCriacao" BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      } else {
        query += ` WHERE c."DataCriacao" BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        hasWhere = true;
      }

      params.push(ini, fim);
      paramIndex += 2;
    }

    // --------- Filtro de SETOR (opcional) ----------
    // Aceita múltiplos setores via CSV, ex: "1,2,3"
    const id_setor = parseIntsCSV?.(filters.id_setor) || null;

    if (id_setor && id_setor.length) {
      if (hasWhere) {
        query += ` AND l."IdSetor" = ANY($${paramIndex})`;
      } else {
        query += ` WHERE l."IdSetor" = ANY($${paramIndex})`;
        hasWhere = true;
      }

      params.push(id_setor); // array -> ANY($n)
      paramIndex++;
    }

    // Agrupa por SETOR
    query += `
      GROUP BY l."IdSetor", s."Nome"
      ORDER BY total DESC, s."Nome" ASC;
    `;

    const { rows } = await pool.query(query, params);

    const result = rows.map((r) => ({
      id_setor: Number(r.id_setor), 
      nome_setor: r.nome_setor,
      total: Number(r.total),
    }));

    return result;
  } catch (err) {
    console.error("Erro em KPI de volume de chamados por setor:", err);
    throw err;
  }
}


module.exports = { kpiTotalChamados, kpiTempoMedioConclusao, kpiTempoMedioAtendimento, kpiSelectChamados, kpiVolumeAtendimentosPorIntervalo, kpiVolumeChamadosPorTipo, kpiVolumeChamadosPorSetor }