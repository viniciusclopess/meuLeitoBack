const express = require('express');
const { postUsuario, getUsuario, putUsuario } = require('../controllers/usuariosController');

const router = express.Router();

router.post('/', postUsuario);
router.get('/', getUsuario);
router.put('/', putUsuario);

module.exports = router;
