const express = require('express');
const { postPerfil, getPerfil, putPerfil, deletePerfil } = require('../controllers/perfisController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')
const router = express.Router();

router.post('/', postPerfil);
router.get('/', getPerfil);
router.put('/:id', putPerfil);
router.delete('/:id', deletePerfil);

module.exports = router;
