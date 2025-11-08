const { insertProfissional, selectProfissional, updateProfissional, removeProfissional } = require('../services/profissionaisService');

async function postProfissional(req, res) {
  try {
    const resultado = await insertProfissional(req.body);
    if (resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }
    return res.status(201).json({
      ok: true,
      message: 'Profissional criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar profissional.',
      error: err.message
    });
  }
}

async function getProfissional(req, res) {
  try {
    const { nome, page, pageSize } = req.query;
    const result = await selectProfissional({ nome, page, pageSize });

    if (!result || (Array.isArray(result.data) && result.data.length === 0)) {
      return res.status(404).json({
        message: 'Profissional não encontrado.',
        data: []
      });
    }

    return res.status(200).json({
      message: 'Profissionais encontrados',
      ...result
    });
  } catch (err) {
    console.error('Erro em getProfissional:', err);
    return res.status(500).json({
      message: 'Erro ao buscar profissional.',
      error: err.message
    });
  }
}

async function putProfissional(req, res){
  try{
    const { id } = req.params;
    const resultado = await updateProfissional( id, req.body )
    if(!resultado) return res.status(404).json({
      message: "Profissional não encontrado."
    });
    return res.status(200).json({
      message: "Profissionais atualizados:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao atualizar profissional.', 
      error: err.message
    })
  }
}

async function deleteProfissional(req, res){
  try{
    const { id } = req.params;
    const resultado = await removeProfissional(id)
    if(!resultado) return res.status(404).json({
      message: "Profissional não encontrado."
    });
    return res.status(200).json({
      message: "Profissionais removidos:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao deletar profissional.', 
      error: err.message
    })
  }
}

module.exports = { postProfissional, getProfissional, putProfissional, deleteProfissional };
