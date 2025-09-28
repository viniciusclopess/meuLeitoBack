const express = require('express');
const { createPessoa, getPessoa, updatePessoa } = require('../controllers/pessoasController');

const router = express.Router();

router.post('/', createPessoa);
router.get('/', getPessoa);
router.put('/', updatePessoa);

module.exports = router;
