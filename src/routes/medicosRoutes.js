const express = require('express');
const { createMedico, getMedico, updateMedico } = require('../controllers/medicosController');

const router = express.Router();

router.post('/', createMedico);
router.get('/', getMedico);
router.put('/', updateMedico);

module.exports = router;
