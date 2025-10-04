const express = require('express');
const { createSetor, getSetor, updateSetor } = require('../controllers/setoresController');

const router = express.Router();

router.post('/', createSetor);
router.get('/', getSetor);
router.put('/', updateSetor);

module.exports = router;
