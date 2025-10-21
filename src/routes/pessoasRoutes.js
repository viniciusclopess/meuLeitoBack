const express = require('express');
const { postPessoa, getPessoa, putPessoa, deletePessoa } = require('../controllers/pessoasController');

const router = express.Router();

router.post('/', postPessoa);
router.get('/', getPessoa);
router.put('/', putPessoa);
router.delete('/:id', deletePessoa)
module.exports = router;
