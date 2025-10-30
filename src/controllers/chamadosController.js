const { insertChamado, selectChamado, acceptChamado, finishChamado } = require('../services/chamadosService');

async function postChamado(req, res) {
  try {
    const resultado = await insertChamado(req.body);

    if (resultado && resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'Chamado criado com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar chamado.',
      error: err.message
    });
  }
}

async function getChamado(req, res) {
  try {
    const { id_paciente_leito, id_profissional, id_paciente, id_leito, status } = req.query;
    const resultado = await selectChamado( id_paciente_leito, id_profissional, id_paciente, id_leito, status );

    if (!resultado || resultado.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Nenhum registro de chamado encontrado.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Chamados encontrados:',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      ok: false,
      message: 'Erro ao buscar chamados.',
      error: err.message
    });
  }
}

async function putAcceptChamado(req, res) {
  try {
    const { id_chamado } = req.params;
    const { id_profissional } = req.body;

    const resultado = await acceptChamado(id_chamado, id_profissional);

    if (!resultado) {
      return res.status(404).json({
        ok: false,
        message: 'Chamado não encontrado.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Chamado aceito com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      ok: false,
      message: 'Erro ao aceitar chamado.',
      error: err.message
    });
  }
}

async function putFinishChamado(req, res) {
  try {
    const { id_chamado } = req.params;
    const resultado = await finishChamado(id_chamado, req.body);

    if (!resultado) {
      return res.status(404).json({
        ok: false,
        message: 'Chamado não encontrado.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Chamado finalizado com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      ok: false,
      message: 'Erro ao finalizar chamado.',
      error: err.message
    });
  }
}


module.exports = { postChamado, getChamado, putAcceptChamado, putFinishChamado };
