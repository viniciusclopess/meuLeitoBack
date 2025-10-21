const { insertSetor, selectSetor, updateSetor, removeSetor } = require('../services/setoresService');

async function postSetor(req, res) {
  try {
    const { setor } = req.body;

    const resultado = await insertSetor( setor );

    if (resultado.warning) { 
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Setor criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar setor.',
      error: err.message
    });
  }
}

async function getSetor(req, res){
  try{
    const { codigo_setor } = req.query;
    const resultado = await selectSetor(codigo_setor);
    if(!resultado) return res.status(404).json({message: "Setor não encontrado"});
    return res.status(200).json(resultado)
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar setor.', error: err.message});
  }
}

async function putSetor(req, res){
  try{
    const { setor } = req.body;
    const resultado = await updateSetor(setor)
    if(!resultado) return res.status(404).json({message: "Setor não encontrado"});
    return res.status(200).json( resultado )
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar setor.', error: err.message})
  }
}

async function deleteSetor(req, res){
  try{
    const id  = Number(req.params.id);
    const resultado = await removeSetor(id)
    if(!resultado) return res.status(404).json({message: "Setor não encontrado"});

    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar setor.', error: err.message})
  }
}

module.exports = { postSetor, getSetor, putSetor, deleteSetor };