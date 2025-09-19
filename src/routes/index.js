// routes/index.js
const express = require('express');
const router = express.Router();

// sub-routers por domínio
const pacientes = require('./pacientesRoutes');
// const pessoas   = require('./pessoas');
// const usuarios  = require('./usuarios');
// const leitos    = require('./leitos');

router.use('/pacientes', pacientes);
// router.use('/pessoas',   pessoas);
// router.use('/usuarios',  usuarios);
// router.use('/leitos',    leitos);

router.get('/health', (req, res) => res.json({ ok: true }));

module.exports = router;
