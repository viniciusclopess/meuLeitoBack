const { insertSetor, selectSetor, updateSetor, removeSetor } = require('../services/setoresService');

async function postSetor(req, res) {
  try {
    const resultado = await insertSetor(req.body);
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
    const { nome } = req.query; 
    const resultado = await selectSetor(nome);
    if(!resultado) return res.status(404).json( {message: "Setor não encontrado."} );
    return res.status(200).json( {message: "Setores encontrados:", data: resultado} )
  } catch (err) {
    console.error(err);
    return res.status(400).json( { message: 'Erro ao buscar setor.', error: err.message} );
  }
}

async function putSetor(req, res){
  try{
    const { id }  = req.params;
    const resultado = await updateSetor(id, req.body)
    if(!resultado) return res.status(404).json( {message: "Setor não encontrado."} );
    return res.status(200).json( {message: "Setores atualizados:", data: resultado} )
  } catch(err){
    console.error(err);
    return res.status(400).json( { message: 'Erro ao atualizar setor.', error: err.message} )
  }
}

async function deleteSetor(req, res){
  try{
    const { id }  = req.params;
    const resultado = await removeSetor(id)
    if(!resultado) return res.status(404).json({message: "Setor não encontrado."});

    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar setor.', error: err.message})
  }
}

module.exports = { postSetor, getSetor, putSetor, deleteSetor };