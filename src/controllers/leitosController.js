const { insertLeito, selectLeito, selectPacienteLeito, updateLeito, removeLeito } = require('../services/leitosService');

async function postLeito(req, res) {
  try {
    const resultado = await insertLeito(req.body);
    if (resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning,
        data: {
          leitoId: resultado.leitoId
        }
      });
    }
    return res.status(201).json({
      ok: true,
      message: 'Leito criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar leito.',
      error: err.message
    });
  }
}

async function getLeito(req, res) {
  try {
    const { nome } = req.query;
    const resultado = await selectLeito(nome);
    if (!resultado) return res.status(404).json({
      message: "Leito não encontrado."
    });
    return res.status(200).json({
      message: "Leitos encontrados:",
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: 'Erro ao buscar leito.',
      error: err.message
    });
  }
}

async function getPacienteLeito(req, res) {
  try {
    const { id } = req.params;
    const resultado = await selectPacienteLeito(id);
    if (!resultado) return res.status(404).json({
      message: "Paciente não encontrado."
    });
    return res.status(200).json({
      message: "Paciente encontrados:",
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: 'Erro ao buscar paciente.',
      error: err.message
    });
  }
}

async function putLeito(req, res) {
  try {
    const { id } = req.params;
    const resultado = await updateLeito(id, req.body)
    if (!resultado) return res.status(404).json({
      message: "Leito não encontrado."
    });
    return res.status(200).json({
      message: "Leitos atualizados:",
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: 'Erro ao atualizar leito.',
      error: err.message
    })
  }
}

async function deleteLeito(req, res) {
  try {
    const { id } = req.params;
    const resultado = await removeLeito(id)
    if (!resultado) return res.status(404).json({
      message: "Leito não encontrado."
    });
    return res.status(200).json({
      message: "Leitos removidos:",
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: 'Erro ao deletar leito.',
      error: err.message
    })
  }
}

module.exports = { postLeito, getLeito, getPacienteLeito, putLeito, deleteLeito };
