const express = require('express');
const { postSetor, getSetor, putSetor } = require('../controllers/setoresController');

const router = express.Router();

router.post('/', postSetor);
router.get('/', getSetor);
router.put('/', putSetor);

module.exports = router;
