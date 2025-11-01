const express = require('express');
const { postPermissao, getPermissao, putPermissao, deletePermissao } = require('../controllers/permissoesController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', autenticarJWT, postPermissao);
router.get('/', autenticarJWT, getPermissao);
router.put('/:id', autenticarJWT, putPermissao);
router.delete('/:id', autenticarJWT, deletePermissao);

module.exports = router;
