const express = require('express');
const { postPermissao, getPermissao, putPermissao, deletePermissao } = require('../controllers/permissoesController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postPermissao);
router.get('/', getPermissao);
router.put('/:id', putPermissao);
router.delete('/:id', deletePermissao);

module.exports = router;
