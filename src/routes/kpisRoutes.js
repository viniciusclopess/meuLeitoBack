const express = require("express");
const { getVisaoGeral, getTempoMedio, getTempoMedioAtendimento, getChamadosEnfermeiros } = require("../controllers/kpisController");

const router = express.Router();

router.get("/visao-geral", getVisaoGeral);
router.get("/tempo-medio", getTempoMedio);
router.get("/tempo-medio-atendimento", getTempoMedioAtendimento);
router.get("/chamado-enfermeiros", getChamadosEnfermeiros);

module.exports = router;
