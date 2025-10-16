const express = require('express');
const { postChamado, getChamado, putAceitarChamado, putFinalizarChamado } = require('../controllers/chamadosController');

const router = express.Router();

router.post('/', postChamado);
router.get('/', getChamado);
router.put('/aceitarChamado', putAceitarChamado);
router.put('/finalizarChamado', putFinalizarChamado);

module.exports = router;
