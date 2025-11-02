const express = require('express');
const { postChamado, getChamado, putAcceptChamado, putFinishChamado } = require('../controllers/chamadosController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postChamado);
router.get('/', autenticarJWT, getChamado);
router.put('/aceitar-chamado/:id_chamado', autenticarJWT, putAcceptChamado);
router.put('/finalizar-chamado/:id_chamado', autenticarJWT, putFinishChamado);

module.exports = router;
