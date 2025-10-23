const express = require('express');
const { postAlergia, getAlergia, putAlergia, deleteAlergia } = require('../controllers/alergiasController');

const router = express.Router();

router.post('/', postAlergia);
router.get('/', getAlergia);
router.put('/:id', putAlergia);
router.delete('/:id', deleteAlergia);

module.exports = router;
