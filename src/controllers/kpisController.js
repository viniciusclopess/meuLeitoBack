const { kpiTotalChamados, kpiTempoMedioConclusao, kpiTempoMedioAtendimento, kpiSelectChamados, kpiVolumeAtendimentosPorIntervalo, kpiVolumeChamadosPorTipo, kpiVolumeChamadosPorSetor } = require("../services/kpisService");


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

async function getVolumeAtendimentosPorIntervalo(req, res) {
  try {
    const resultado = await kpiVolumeAtendimentosPorIntervalo(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro em extrair intervalos de chamados:", error);
    return res.status(500).json({
      message: "Erro ao buscar KPI's de intervalos.",
      error: error.message,
    });
  }
}

async function getVolumeChamadosPorTipo(req, res) {
  try {
    const resultado = await kpiVolumeChamadosPorTipo(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro em extrair intervalos de tipo de chamados:", error);
    return res.status(500).json({
      message: "Erro ao buscar KPI's de intervalos de tipos.",
      error: error.message,
    });
  }
}

async function getChamadosEnfermeiros(req, res) {
  try {
    const filtros = req.query;
    const resultado = await kpiSelectChamados(filtros);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar chamados de enfermeiros:", error);

    return res.status(500).json({
      message: "Erro ao buscar os chamados.",
      error: error.message,
    });
  }
}

async function getVolumeChamadosPorSetor(req, res) {
  try {
    const filtros = req.query;
    const resultado = await kpiVolumeChamadosPorSetor(filtros);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar chamados de setores:", error);

    return res.status(500).json({
      message: "Erro ao buscar os chamados.",
      error: error.message,
    });
  }
}

module.exports = { getVisaoGeral, getTempoMedio, getTempoMedioAtendimento, getChamadosEnfermeiros, getVolumeAtendimentosPorIntervalo, getVolumeChamadosPorTipo, getVolumeChamadosPorSetor };