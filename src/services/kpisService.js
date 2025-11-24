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
    const conditions = ['c."DataCriacao" >= $1', 'c."DataCriacao" < $2'];
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



module.exports = { kpiTotalChamados, kpiTempoMedioConclusao, kpiTempoMedioAtendimento }