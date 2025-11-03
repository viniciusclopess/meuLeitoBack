const express = require('express');
const { postProfissional, getProfissional, putProfissional, deleteProfissional } = require('../controllers/profissionaisController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', autenticarJWT, postProfissional);
router.get('/', autenticarJWT, getProfissional);
router.put('/:id', autenticarJWT, putProfissional);
router.delete('/:id', autenticarJWT, deleteProfissional);

module.exports = router;
