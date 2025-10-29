const express = require('express');
const { 
    postPacienteLeito, getPacienteLeito, putPacienteLeito, 
    postProfissionalPermissao, getProfissionalPermissao, putProfissionalPermissao, deleteProfissionalPermissao,
    postProfissionaisSetores, getProfissionaisSetores, putProfissionaisSetores, deleteProfissionaisSetores
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

module.exports = router;
