const express = require('express');
const { postSetor, getSetor, putSetor, deleteSetor } = require('../controllers/setoresController');

const router = express.Router();

router.post('/', autenticarJWT, postSetor);
router.get('/', autenticarJWT, getSetor);
router.put('/:id', autenticarJWT, putSetor);
router.delete('/:id', autenticarJWT, deleteSetor);

module.exports = router;
