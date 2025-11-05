const express = require('express');
const { postChamado, getChamado, getUltimoChamado ,putAcceptChamado, putFinishChamado } = require('../controllers/chamadosController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postChamado);
router.get('/', getChamado);
router.get('/ultimo-chamado', getUltimoChamado);
router.put('/aceitar-chamado/:id_chamado', putAcceptChamado);
router.put('/finalizar-chamado/:id_chamado', putFinishChamado);

module.exports = router;
