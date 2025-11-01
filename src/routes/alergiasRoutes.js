const express = require('express');
const { postAlergia, getAlergia, putAlergia, deleteAlergia } = require('../controllers/alergiasController');
const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', autenticarJWT, postAlergia);
router.get('/', autenticarJWT, getAlergia);
router.put('/:id', autenticarJWT, putAlergia);
router.delete('/:id', autenticarJWT, deleteAlergia);

module.exports = router;
