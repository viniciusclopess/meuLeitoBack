const express = require("express");
const { getVisaoGeral, getTempoMedio } = require("../controllers/kpisController");

const router = express.Router();

router.get("/visao-geral", getVisaoGeral);
router.get("/tempo-medio", getTempoMedio);

module.exports = router;
