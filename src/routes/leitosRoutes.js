const express = require('express');
const { postLeito, getLeito, putLeito, deleteLeito } = require('../controllers/leitosController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', autenticarJWT, postLeito);
router.get('/', autenticarJWT,  getLeito);
router.put('/:id', autenticarJWT, putLeito);
router.delete('/:id', autenticarJWT, deleteLeito);

module.exports = router;
