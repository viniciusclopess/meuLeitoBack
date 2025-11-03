const express = require('express');
const { postLeito, getLeito, getPacienteLeito, putLeito, deleteLeito } = require('../controllers/leitosController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', autenticarJWT, postLeito);
router.get('/', autenticarJWT, getLeito);
router.put('/:id', autenticarJWT, putLeito);
router.delete('/:id', autenticarJWT, deleteLeito);
router.get('/paciente-leito/:id', autenticarJWT, getPacienteLeito);

module.exports = router;
