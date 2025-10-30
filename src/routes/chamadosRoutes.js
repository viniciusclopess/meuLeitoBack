const express = require('express');
const { postChamado, getChamado, putAcceptChamado, putFinishChamado } = require('../controllers/chamadosController');

const router = express.Router();

router.post('/', postChamado);
router.get('/', getChamado);
router.put('/aceitar-chamado/:id_chamado', putAcceptChamado);
router.put('/finalizar-chamado/:id_chamado', putFinishChamado);

module.exports = router;
