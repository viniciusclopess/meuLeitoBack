// routes/index.js
const express = require('express');
const router = express.Router();

// sub-routers por domínio
const pacientes     = require('./pacientesRoutes');
const medicos       = require('./medicosRoutes');
const enfermeiras   = require('./enfermeirasRoutes');
const leitos        = require('./leitosRoutes');
const usuarios      = require('./usuariosRoutes');
const pessoas       = require('./pessoasRoutes')
const setores       = require('./setoresRoutes')

router.use('/pacientes',    pacientes);
router.use('/medicos',      medicos);
router.use('/enfermeiras',  enfermeiras);
router.use('/leitos',       leitos);
router.use('/usuarios',     usuarios);
router.use('/pessoas',      pessoas);
router.use('/setores',      setores);

router.get('/health', (req, res) => res.json({ ok: true }));

module.exports = router;
