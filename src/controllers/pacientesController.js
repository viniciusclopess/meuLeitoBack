const { insertPaciente, selectPaciente, updatePaciente, removePaciente } = require('../services/pacientesService');

async function postPaciente(req, res) {
  try {
    const resultado = await insertPaciente(req.body);
    if (resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning,
        data: {
          pacienteId: resultado.pacienteId
        }
      });
    }
    return res.status(201).json({
      ok: true,
      message: 'Paciente criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar paciente.',
      error: err.message
    });
  }
}

async function getPaciente(req, res){
  try{
    const { nome } = req.query;
    const resultado = await selectPaciente(nome);
    if(!resultado) return res.status(404).json({
      message: "Paciente não encontrado."
    });
    return res.status(200).json({
      message: "Pacientes encontrados:", 
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

async function putPaciente(req, res){
  try{
    const { id } = req.params;
    const resultado = await updatePaciente( id, req.body )
    if(!resultado) return res.status(404).json({
      message: "Paciente não encontrado."
    });
    return res.status(200).json({
      message: "Pacientes atualizados:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao atualizar paciente.', 
      error: err.message
    })
  }
}

async function deletePaciente(req, res){
  try{
    const { id } = req.params;
    const resultado = await removePaciente(id)
    if(!resultado) return res.status(404).json({
      message: "Paciente não encontrado."
    });
    return res.status(200).json({
      message: "Pacientes removidos:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao deletar paciente.', 
      error: err.message
    })
  }
}

module.exports = { postPaciente, getPaciente, putPaciente, deletePaciente };
