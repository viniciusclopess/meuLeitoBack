const express = require("express");
const { getVisaoGeral } = require("../controllers/kpisController");

const router = express.Router();

router.get("/visao-geral", getVisaoGeral);

module.exports = router;
