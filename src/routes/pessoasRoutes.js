const express = require('express');
const { postPessoa, getPessoa, putPessoa } = require('../controllers/pessoasController');

const router = express.Router();

router.post('/', postPessoa);
router.get('/', getPessoa);
router.put('/', putPessoa);

module.exports = router;
