// src/routes/loginRoutes.js
const express = require('express');
const router = express.Router();
const { fazerLogin } = require('../controllers/authController');

router.post('/', fazerLogin);

module.exports = router;
