const express = require('express');
const { postPaciente, getPaciente, putPaciente, deletePaciente } = require('../controllers/pacientesController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')
const router = express.Router();

router.post('/', postPaciente);
router.get('/', getPaciente);
router.put('/:id', putPaciente);
router.delete('/:id', deletePaciente);

module.exports = router;
