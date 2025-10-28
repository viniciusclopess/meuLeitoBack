const { insertPacienteLeito, selectPacienteLeito, updatePacienteLeito } = require('../services/joinsService');

async function postPacienteLeito(req, res) {
  try {
    const resultado = await insertPacienteLeito(req.body);
    if (resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }
    return res.status(201).json({
      ok: true,
      message: 'Alocação criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar atendimento.',
      error: err.message
    });
  }
}

async function getPacienteLeito(req, res){
  try{
    const { nome } = req.query;
    const resultado = await selectPacienteLeito(nome);
    if(!resultado) return res.status(404).json({
      message: "Alocação não encontrada."
    });
    return res.status(200).json({
      message: "Alocações encontradas:", 
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ 
        message: 'Erro ao buscar atendimento.', 
        error: err.message
      });
  }
}

async function putPacienteLeito(req, res){
  try{
    const { id } = req.params;
    const resultado = await updatePacienteLeito( id, req.body )
    if(!resultado) return res.status(404).json({
      message: "Alocação não encontrada."
    });
    return res.status(200).json({
      message: "Alocações atualizados:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao atualizar atendimento.', 
      error: err.message
    })
  }
}

module.exports = { postPacienteLeito, getPacienteLeito, putPacienteLeito };
