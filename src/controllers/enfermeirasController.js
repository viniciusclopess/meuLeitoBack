const { insertEnfermeira, selectEnfermeira, updateEnfermeira, removeEnfermeira } = require('../services/enfermeirasService');

async function postEnfermeira(req, res) {
  try {
    const { enfermeira } = req.body;

    const resultado = await insertEnfermeira( enfermeira );

    if (resultado.warning) {
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Enfermeira criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar enfermeira.',
      error: err.message
    });
  }
}

async function getEnfermeira(req, res) {
  try {
    const { nome } = req.query;
    const resultado = await selectEnfermeira(nome);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar enfermeiras.' });
  }
}

async function putEnfermeira(req, res){
  try{
    const { enfermeira } = req.body;
    const resultado = await updateEnfermeira(enfermeira)

    if(!resultado) return res.status(404).json({message: "Enfermeira não encontrada"});
    return res.status(200).json({ data: resultado})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar enfermeira.', error: err.message})
  }
}

async function deleteEnfermeira(req, res){
  try{
    const { id } = req.body;
    const resultado = await removeEnfermeira(id)

    if(!resultado) return res.status(404).json({message: "Enfermeira não encontrada"});
    return res.status(200).json({ data: resultado})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar enfermeira.', error: err.message})
  }
}

module.exports = { postEnfermeira, getEnfermeira, putEnfermeira, deleteEnfermeira };
