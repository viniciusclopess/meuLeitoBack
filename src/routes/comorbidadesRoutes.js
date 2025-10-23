const express = require('express');
const { postComorbidade, getComorbidade, putComorbidade, deleteComorbidade } = require('../controllers/comorbidadesController');

const router = express.Router();

router.post('/', postComorbidade);
router.get('/', getComorbidade);
router.put('/', putComorbidade);
router.delete('/:id', deleteComorbidade);

module.exports = router;
