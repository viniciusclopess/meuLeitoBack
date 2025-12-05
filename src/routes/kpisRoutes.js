const express = require("express");
const { getVisaoGeral, getTempoMedio, getTempoMedioAtendimento, getChamadosEnfermeiros, getVolumeAtendimentosPorIntervalo, getVolumeChamadosPorTipo, getVolumeChamadosPorSetor } = require("../controllers/kpisController");

const router = express.Router();

router.get("/visao-geral", getVisaoGeral);
router.get("/tempo-medio", getTempoMedio);
router.get("/tempo-medio-atendimento", getTempoMedioAtendimento);
router.get("/chamado-enfermeiros", getChamadosEnfermeiros);
router.get("/intervalos-chamados", getVolumeAtendimentosPorIntervalo);
router.get("/intervalos-tipos", getVolumeChamadosPorTipo);
router.get("/chamados-setores", getVolumeChamadosPorSetor);

module.exports = router;
