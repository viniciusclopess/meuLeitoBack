const express = require('express');
const { postPaciente, getPaciente, putPaciente } = require('../controllers/pacientesController');

const router = express.Router();

router.post('/', postPaciente);
router.get('/', getPaciente);
router.put('/', putPaciente);

module.exports = router;
