const express = require('express');
const { postProfissional, getProfissional, putProfissional, deleteProfissional } = require('../controllers/profissionaisController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postProfissional);
router.get('/', getProfissional);
router.put('/:id',  putProfissional);
router.delete('/:id',  deleteProfissional);

module.exports = router;
