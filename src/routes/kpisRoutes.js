const express = require("express");
const { getVisaoGeral, getTempoMedio, getTempoMedioAtendimento } = require("../controllers/kpisController");

const router = express.Router();

router.get("/visao-geral", getVisaoGeral);
router.get("/tempo-medio", getTempoMedio);
router.get("/tempo-medio-atendimento", getTempoMedioAtendimento);

module.exports = router;
