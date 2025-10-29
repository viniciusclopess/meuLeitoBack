const express = require('express');
const { 
    postPacienteLeito, getPacienteLeito, putPacienteLeito, 
    postProfissionalPermissao, getProfissionalPermissao, putProfissionalPermissao, deleteProfissionalPermissao
} = require('../controllers/joinsController');

const router = express.Router();

router.post('/alocacao/', postPacienteLeito);
router.get('/alocacao/', getPacienteLeito);
router.put('/alocacao/:id', putPacienteLeito);

router.post('/permissao/', postProfissionalPermissao);
router.get('/permissao/', getProfissionalPermissao);
router.put('/permissao/:id', putProfissionalPermissao);
router.delete('/permissao/:id', deleteProfissionalPermissao);

module.exports = router;
