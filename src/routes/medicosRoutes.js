const express = require('express');
const { criarMedico, getMedico, updateMedico } = require('../controllers/medicosController');

const router = express.Router();

router.post('/', criarMedico);
router.get('/', getMedico);
router.put('/', updateMedico);

module.exports = router;
