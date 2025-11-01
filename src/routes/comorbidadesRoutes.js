const express = require('express');
const { postComorbidade, getComorbidade, putComorbidade, deleteComorbidade } = require('../controllers/comorbidadesController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', autenticarJWT, postComorbidade);
router.get('/', autenticarJWT, getComorbidade);
router.put('/:id', autenticarJWT, putComorbidade);
router.delete('/:id', autenticarJWT, deleteComorbidade);

module.exports = router;
