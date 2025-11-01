const express = require('express');
const { postPerfil, getPerfil, putPerfil, deletePerfil } = require('../controllers/perfisController');
const { autenticarJWT } = require('../middlewares/authMiddleware')
const router = express.Router();

router.post('/', autenticarJWT, postPerfil);
router.get('/', autenticarJWT, getPerfil);
router.put('/:id', autenticarJWT, putPerfil);
router.delete('/:id', autenticarJWT, deletePerfil);

module.exports = router;
