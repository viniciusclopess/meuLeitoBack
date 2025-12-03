const express = require("express");
const { getVisaoGeral, getTempoMedio, getTempoMedioAtendimento, getChamadosEnfermeiros, getVolumeAtendimentosPorIntervalo, getVolumeChamadosPorTipo } = require("../controllers/kpisController");

const router = express.Router();

router.get("/visao-geral", getVisaoGeral);
router.get("/tempo-medio", getTempoMedio);
router.get("/tempo-medio-atendimento", getTempoMedioAtendimento);
router.get("/chamado-enfermeiros", getChamadosEnfermeiros);
router.get("/intervalos-chamados", getVolumeAtendimentosPorIntervalo);
router.get("/intervalos-tipos", getVolumeChamadosPorTipo);

module.exports = router;
