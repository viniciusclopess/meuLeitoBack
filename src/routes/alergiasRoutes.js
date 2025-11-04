const express = require('express');
const { postAlergia, getAlergia, putAlergia, deleteAlergia } = require('../controllers/alergiasController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postAlergia);
router.get('/', getAlergia);
router.put('/:id', putAlergia);
router.delete('/:id', deleteAlergia);

module.exports = router;
