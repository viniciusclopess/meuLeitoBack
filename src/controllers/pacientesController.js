// controllers/pacienteController.js
const { createPacienteComPessoa } = require('../services/pacientesService');

async function criarPaciente(req, res) {
  try {
    const { pessoa, paciente } = req.body;

    const resultado = await createPacienteComPessoa(pessoa, paciente);

    if (resultado.warning) {
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Paciente criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar paciente.',
      error: err.message
    });
  }
}

module.exports = { criarPaciente };
