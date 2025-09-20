// routes/pacienteRoutes.js
const express = require('express');
const { criarPaciente, getPaciente, updatePaciente } = require('../controllers/pacientesController');

const router = express.Router();

router.post('/', criarPaciente);
router.get('/', getPaciente);
router.put('/', updatePaciente);

module.exports = router;
