const express = require('express');
const { postComorbidade, getComorbidade, putComorbidade, deleteComorbidade } = require('../controllers/comorbidadesController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postComorbidade);
router.get('/', getComorbidade);
router.put('/:id', putComorbidade);
router.delete('/:id', deleteComorbidade);

module.exports = router;
