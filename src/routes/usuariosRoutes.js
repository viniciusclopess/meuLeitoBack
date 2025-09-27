const express = require('express');
const { createUsuario, getUsuario, updateUsuario } = require('../controllers/usuariosController');

const router = express.Router();

router.post('/', createUsuario);
router.get('/', getUsuario);
router.put('/', updateUsuario);

module.exports = router;
