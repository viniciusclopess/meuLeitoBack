// routes/pacienteRoutes.js
const express = require('express');
const { criarPaciente } = require('../controllers/pacientesController');

const router = express.Router();

router.post('/', criarPaciente);

module.exports = router;
