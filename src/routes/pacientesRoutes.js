const express = require('express');
const { postPaciente, getPaciente, putPaciente, deletePaciente } = require('../controllers/pacientesController');
const { autenticarJWT } = require('../middlewares/authMiddleware')
const router = express.Router();

router.post('/', autenticarJWT, postPaciente);
router.get('/', autenticarJWT, getPaciente);
router.put('/:id', autenticarJWT, putPaciente);
router.delete('/:id', autenticarJWT, deletePaciente);

module.exports = router;
