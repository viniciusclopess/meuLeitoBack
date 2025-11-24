const { kpiTotalChamados, kpiTempoMedioConclusao, kpiTempoMedioAtendimento } = require("../services/kpisService");


async function getVisaoGeral(req, res) {
  try {
    const resultado = await kpiTotalChamados(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro em extrair total de chamados:", error);
    return res.status(500).json({
      message: "Erro ao buscar KPI's de visão geral.",
      error: error.message,
    });
  }
}

async function getTempoMedio(req, res) {
  try {
    const resultado = await kpiTempoMedioConclusao(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro em extrair tempo médio de chamados:", error);
    return res.status(500).json({
      message: "Erro ao buscar KPI's de tempo médio.",
      error: error.message,
    });
  }
}

async function getTempoMedioAtendimento(req, res) {
  try {
    const resultado = await kpiTempoMedioAtendimento(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro em extrair tempo médio de chamados:", error);
    return res.status(500).json({
      message: "Erro ao buscar KPI's de tempo médio.",
      error: error.message,
    });
  }
}
module.exports = { getVisaoGeral, getTempoMedio, getTempoMedioAtendimento };