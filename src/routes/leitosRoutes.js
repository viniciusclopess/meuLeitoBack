const express = require('express');
const { criarLeito, getLeito, updateLeito } = require('../controllers/leitosController');

const router = express.Router();

router.post('/', criarLeito);
router.get('/', getLeito);
router.put('/', updateLeito);

module.exports = router;
