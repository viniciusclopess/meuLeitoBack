const express = require('express');
const { criarEnfermeira, getEnfermeira, updateEnfermeira } = require('../controllers/enfermeirasController');

const router = express.Router();

router.post('/', criarEnfermeira);
router.get('/', getEnfermeira);
router.put('/', updateEnfermeira);

module.exports = router;
