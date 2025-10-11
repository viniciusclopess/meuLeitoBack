const express = require('express');
const { postEnfermeira, getEnfermeira, putEnfermeira } = require('../controllers/enfermeirasController');

const router = express.Router();

router.post('/', postEnfermeira);
router.get('/', getEnfermeira);
router.put('/', putEnfermeira);

module.exports = router;
