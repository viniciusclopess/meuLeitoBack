const express = require('express');
const { postPaciente, getPaciente, putPaciente, deletePaciente } = require('../controllers/pacientesController');

const router = express.Router();

router.post('/', postPaciente);
router.get('/', getPaciente);
router.put('/', putPaciente);
router.delete('/:id', deletePaciente);

module.exports = router;
