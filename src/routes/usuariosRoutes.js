const express = require('express');
const { postUsuario, getUsuario, putUsuario, deleteUsuario } = require('../controllers/usuariosController');

const router = express.Router();

router.post('/', postUsuario);
router.get('/', getUsuario);
router.put('/', putUsuario);
router.delete('/:id', deleteUsuario);

module.exports = router;
