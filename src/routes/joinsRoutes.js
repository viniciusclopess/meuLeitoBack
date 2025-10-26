const express = require('express');
const { postPacienteLeito, getPacienteLeito, putPacienteLeito } = require('../controllers/joinsController');

const router = express.Router();

router.post('/atendimento/', postPacienteLeito);
router.get('/atendimento/', getPacienteLeito);
router.put('atendimento/:id', putPacienteLeito);

module.exports = router;
