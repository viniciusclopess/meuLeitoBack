const express = require('express');
const { postLeito, getLeitos, putLeito, deleteLeito } = require('../controllers/leitosController');

const router = express.Router();

router.post('/', postLeito);
router.get('/', getLeitos);
router.put('/:id', putLeito);
router.delete('/:id', deleteLeito);

module.exports = router;
