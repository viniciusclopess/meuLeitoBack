const express = require('express');
const { createEnfermeira, getEnfermeira, updateEnfermeira } = require('../controllers/enfermeirasController');

const router = express.Router();

router.post('/', createEnfermeira);
router.get('/', getEnfermeira);
router.put('/', updateEnfermeira);

module.exports = router;
