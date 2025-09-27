const express = require('express');
const { createLeito, getLeito, updateLeito } = require('../controllers/leitosController');

const router = express.Router();

router.post('/', createLeito);
router.get('/', getLeito);
router.put('/', updateLeito);

module.exports = router;
