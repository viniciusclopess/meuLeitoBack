const express = require('express');
const { postLeito, getLeito, putLeito } = require('../controllers/leitosController');

const router = express.Router();

router.post('/', postLeito);
router.get('/', getLeito);
router.put('/', putLeito);

module.exports = router;
