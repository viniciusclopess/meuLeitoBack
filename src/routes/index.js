// routes/index.js
const express = require('express');
const router = express.Router();

// sub-routers por domínio
const pacientes = require('./pacientesRoutes');
const medicos   = require('./medicosRoutes');
const enfermeiras  = require('./enfermeirasRoutes');
const leitos    = require('./leitosRoutes');
const usuarios    = require('./usuariosRoutes');


router.use('/pacientes', pacientes);
router.use('/medicos',   medicos);
router.use('/enfermeiras',  enfermeiras);
router.use('/leitos',    leitos);
router.use('/usuarios',    usuarios);


router.get('/health', (req, res) => res.json({ ok: true }));

module.exports = router;
