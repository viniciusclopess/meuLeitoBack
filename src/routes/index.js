// routes/index.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// sub-routers por domínio
const pacientes       = require('./pacientesRoutes');
const leitos          = require('./leitosRoutes');
const setores         = require('./setoresRoutes')
const chamados        = require('./chamadosRoutes')
const login           = require('./authRoutes')
const comorbidades    = require('./comorbidadesRoutes')
const alergias        = require('./alergiasRoutes')
const perfis          = require('./perfisRoutes')
const profissionais   = require('./profissionaisRoutes')
const joins           = require('./joinsRoutes')
const permissoes      = require('./permissoesRoutes')

router.use('/pacientes',        pacientes);
router.use('/leitos',           leitos);
router.use('/setores',          setores);
router.use('/chamados',         chamados);
router.use('/login',            login);
router.use('/comorbidades',     comorbidades);
router.use('/alergias',         alergias);
router.use('/perfis',           perfis);
router.use('/profissionais',    profissionais);
router.use('/joins',            joins);
router.use('/permissoes',       permissoes);

router.get('/health', (_req, res) => res.json({ ok: true }));

// nova rota: saúde do DB
router.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await pool.query('select now() as ts');
    res.json({ ok: true, ts: rows[0].ts });
  } catch (e) {
    console.error('[DB] /health/db:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
