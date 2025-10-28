const express = require('express');
const { postPacienteLeito, getPacienteLeito, putPacienteLeito } = require('../controllers/joinsController');

const router = express.Router();

router.post('/alocacao/', postPacienteLeito);
router.get('/alocacao/', getPacienteLeito);
router.put('/alocacao/:id', putPacienteLeito);

module.exports = router;
