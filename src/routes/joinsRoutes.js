const express = require('express');
const { 
    postPacienteLeito, getPacienteLeito, putPacienteLeito, 
    postProfissionalPermissao, getProfissionalPermissao, putProfissionalPermissao, deleteProfissionalPermissao,
    postProfissionaisSetores, getProfissionaisSetores, putProfissionaisSetores, deleteProfissionaisSetores,
    postPacienteAlergia, getPacienteAlergia, putPacienteAlergia, deletePacienteAlergia,
    postPacienteComorbidade, getPacienteComorbidade, putPacienteComorbidade, deletePacienteComorbidade
} = require('../controllers/joinsController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/alocacao/', autenticarJWT,  postPacienteLeito);
router.get('/alocacao/', autenticarJWT,  getPacienteLeito);
router.put('/alocacao/:id', autenticarJWT,  putPacienteLeito);

router.post('/permissao/', autenticarJWT,  postProfissionalPermissao);
router.get('/permissao/', autenticarJWT,  getProfissionalPermissao);
router.put('/permissao/:id', autenticarJWT,  putProfissionalPermissao);
router.delete('/permissao/:id', autenticarJWT,  deleteProfissionalPermissao);

router.post('/setorizacao/', autenticarJWT,  postProfissionaisSetores);
router.get('/setorizacao/', autenticarJWT,  getProfissionaisSetores);
router.put('/setorizacao/:id', autenticarJWT,  putProfissionaisSetores);
router.delete('/setorizacao/:id', autenticarJWT,  deleteProfissionaisSetores);

router.post('/paciente-alergia/', autenticarJWT,  postPacienteAlergia);
router.get('/paciente-alergia/', autenticarJWT,  getPacienteAlergia);
router.put('/paciente-alergia/:id', autenticarJWT,  putPacienteAlergia);
router.delete('/paciente-alergia/:id', autenticarJWT,  deletePacienteAlergia);

router.post('/paciente-comorbidade/', autenticarJWT,  postPacienteComorbidade);
router.get('/paciente-comorbidade/', autenticarJWT,  getPacienteComorbidade);
router.put('/paciente-comorbidade/:id', autenticarJWT,  putPacienteComorbidade);
router.delete('/paciente-comorbidade/:id', autenticarJWT,  deletePacienteComorbidade);

module.exports = router;