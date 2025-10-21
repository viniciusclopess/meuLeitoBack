const express = require('express');
const { postEnfermeira, getEnfermeira, putEnfermeira, deleteEnfermeira } = require('../controllers/enfermeirasController');

const router = express.Router();

router.post('/', postEnfermeira);
router.get('/', getEnfermeira);
router.put('/', putEnfermeira);
router.delete('/', deleteEnfermeira);

module.exports = router;
