const express = require('express');
const { postMedico, getMedico, putMedico } = require('../controllers/medicosController');

const router = express.Router();

router.post('/', postMedico);
router.get('/', getMedico);
router.put('/', putMedico);

module.exports = router;
