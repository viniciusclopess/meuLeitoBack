const { insertPaciente, selectPaciente, updatePaciente, removePaciente } = require('../services/pacientesService');

async function postPaciente(req, res) {
  try {
    const { paciente } = req.body;
    const resultado = await insertPaciente(paciente);
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

async function getPaciente(req, res){
  try{
    const { nome } = req.query;
    const resultado = await selectPaciente(nome);
    if(!resultado) return res.status(404).json({message: "Paciente não encontrado"});
    return res.status(200).json(resultado)
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar paciente.', error: err.message});
  }
}

async function putPaciente(req, res){
  try{
    const { paciente } = req.body;
    const resultado = await updatePaciente( paciente )

    if(!resultado) return res.status(404).json({message: "Paciente não encontrado"});
    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar paciente.', error: err.message})
  }
}

async function deletePaciente(req, res){
  try{
    const id  = Number(req.params.id);
    const resultado = await removePaciente(id)
    if(!resultado) return res.status(404).json({message: "Paciente não encontrada"});
    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar paciente.', error: err.message})
  }
}

module.exports = { postPaciente, getPaciente, putPaciente, deletePaciente };
