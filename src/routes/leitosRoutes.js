const express = require('express');
const { postLeito, getLeito, putLeito, deleteLeito } = require('../controllers/leitosController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postLeito);
router.get('/', getLeito);
router.put('/:id', putLeito);
router.delete('/:id', deleteLeito);

module.exports = router;
