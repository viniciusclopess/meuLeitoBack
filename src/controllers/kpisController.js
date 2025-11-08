const { kpiTotalChamados } = require("../services/kpisService");


async function getVisaoGeral(req, res) {
  try {
    const resultado = await kpiTotalChamados(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro em getVisaoGeral:", error);
    return res.status(500).json({
      message: "Erro ao buscar KPI de visão geral.",
      error: error.message,
    });
  }
}

module.exports = { getVisaoGeral };