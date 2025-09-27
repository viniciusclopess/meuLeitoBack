const express = require('express');
const { createPaciente, getPaciente, updatePaciente } = require('../controllers/pacientesController');

const router = express.Router();

router.post('/', createPaciente);
router.get('/', getPaciente);
router.put('/', updatePaciente);

module.exports = router;
