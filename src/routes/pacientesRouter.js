// routes/pacientes.js
const express = require('express');
const router = express.Router();
const {
  createPaciente,
  getPacientes,
  updatePacientePartial,
  deletePaciente
} = require('../services/pacientesService');

// GET /pacientes -> lista todos os pacientes
router.get('/', async (req, res, next) => {
  try {
    const lista = await getPacientes();
    res.json(lista);
  } catch (err) { next(err); }
});

// POST /pacientes -> cria novo paciente
router.post('/', async (req, res, next) => {
  try {
    const paciente = await createPaciente(req.body);
    res.status(201).json(paciente);
  } catch (err) { next(err); }
});

// PUT /pacientes/:id -> atualiza todos os campos
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const atualizado = await updatePaciente(id, req.body);
    if (!atualizado) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(atualizado);
  } catch (err) { next(err); }
});

// PATCH /pacientes/:id -> atualização parcial (dinâmica)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Envie ao menos um campo para atualizar.' });
    }
    const atualizado = await updatePacientePartial(id, req.body);
    if (!atualizado) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(atualizado);
  } catch (err) { next(err); }
});

// DELETE /pacientes/:id -> exclui paciente
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletado = await deletePaciente(id);
    if (!deletado) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json({ message: 'Paciente deletado com sucesso.', deletado });
  } catch (err) { next(err); }
});

module.exports = router;
