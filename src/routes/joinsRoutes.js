const express = require('express');
const { 
    postPacienteLeito, getPacienteLeito, putPacienteLeito, putLiberarPacienteLeito, 
    postProfissionalPermissao, getProfissionalPermissao, putProfissionalPermissao, deleteProfissionalPermissao,
    postProfissionaisSetores, getProfissionaisSetores, putProfissionaisSetores, deleteProfissionaisSetores,
    postPacienteAlergia, getPacienteAlergia, putPacienteAlergia, deletePacienteAlergia,
    postPacienteComorbidade, getPacienteComorbidade, putPacienteComorbidade, deletePacienteComorbidade
} = require('../controllers/joinsController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/alocacao/',   postPacienteLeito);
router.get('/alocacao/',   getPacienteLeito);
router.put('/alocacao/:id',   putPacienteLeito);
router.put('/liberacao/:id',   putLiberarPacienteLeito);

router.post('/permissao/',   postProfissionalPermissao);
router.get('/permissao/',   getProfissionalPermissao);
router.put('/permissao/:id',   putProfissionalPermissao);
router.delete('/permissao/:id',   deleteProfissionalPermissao);

router.post('/setorizacao/',   postProfissionaisSetores);
router.get('/setorizacao/',   getProfissionaisSetores);
router.put('/setorizacao/:id',   putProfissionaisSetores);
router.delete('/setorizacao/:id',   deleteProfissionaisSetores);

router.post('/paciente-alergia/',   postPacienteAlergia);
router.get('/paciente-alergia/',   getPacienteAlergia);
router.put('/paciente-alergia/:id',   putPacienteAlergia);
router.delete('/paciente-alergia/:id',   deletePacienteAlergia);

router.post('/paciente-comorbidade/',   postPacienteComorbidade);
router.get('/paciente-comorbidade/',   getPacienteComorbidade);
router.put('/paciente-comorbidade/:id',   putPacienteComorbidade);
router.delete('/paciente-comorbidade/:id',   deletePacienteComorbidade);

module.exports = router;