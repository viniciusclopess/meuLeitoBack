const express = require('express');
const { 
    postPacienteLeito, getPacienteLeito, putPacienteLeito, 
    postProfissionalPermissao, getProfissionalPermissao, putProfissionalPermissao, deleteProfissionalPermissao,
    postProfissionaisSetores, getProfissionaisSetores, putProfissionaisSetores, deleteProfissionaisSetores,
    postPacienteAlergia, getPacienteAlergia, putPacienteAlergia, deletePacienteAlergia
} = require('../controllers/joinsController');

const router = express.Router();

router.post('/alocacao/', postPacienteLeito);
router.get('/alocacao/', getPacienteLeito);
router.put('/alocacao/:id', putPacienteLeito);

router.post('/permissao/', postProfissionalPermissao);
router.get('/permissao/', getProfissionalPermissao);
router.put('/permissao/:id', putProfissionalPermissao);
router.delete('/permissao/:id', deleteProfissionalPermissao);

router.post('/setorizacao/', postProfissionaisSetores);
router.get('/setorizacao/', getProfissionaisSetores);
router.put('/setorizacao/:id', putProfissionaisSetores);
router.delete('/setorizacao/:id', deleteProfissionaisSetores);

router.post('/pacienteAlergia/', postPacienteAlergia);
router.get('/pacienteAlergia/', getPacienteAlergia);
router.put('/pacienteAlergia/:id', putPacienteAlergia);
router.delete('/pacienteAlergia/:id', deletePacienteAlergia);

module.exports = router;
