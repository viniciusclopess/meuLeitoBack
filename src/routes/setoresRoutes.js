const express = require('express');
const { postSetor, getSetor, putSetor, deleteSetor } = require('../controllers/setoresController');
//const { autenticarJWT } = require('../middlewares/authMiddleware')

const router = express.Router();

router.post('/', postSetor);
router.get('/', getSetor);
router.put('/:id', putSetor);
router.delete('/:id', deleteSetor);

module.exports = router;
