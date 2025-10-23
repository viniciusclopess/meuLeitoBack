const { insertComorbidade, selectComorbidade, updateComorbidade, removeComorbidade } = require('../services/comorbidadesService');

async function postComorbidade(req, res) {
  try {
    const resultado = await insertComorbidade(req.body);
    if (resultado.warning) { 
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }
    return res.status(201).json({
      message: 'Comorbidade criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar comorbidade.',
      error: err.message
    });
  }
}

async function getComorbidade(req, res){
  try{
    const { nome } = req.query; 
    const resultado = await selectComorbidade(nome);
    if(!resultado) return res.status(404).json( {message: "Comorbidade não encontrada."} );
    return res.status(200).json( {message: "Comorbidades encontradas:", data: resultado} )
  } catch (err) {
    console.error(err);
    return res.status(400).json( { message: 'Erro ao buscar comorbidade.', error: err.message} );
  }
}

async function putComorbidade(req, res){
  try{
    const { id } = req.params; 
    const resultado = await updateComorbidade(id, req.body)
    if(!resultado) return res.status(404).json( {message: "Comorbidade não encontrada."} );
    return res.status(200).json( {message: "Comorbidades atualizadas:", data: resultado} )
  } catch(err){
    console.error(err);
    return res.status(400).json( { message: 'Erro ao atualizar comorbidade.', error: err.message} )
  }
}

async function deleteComorbidade(req, res){
  try{
    const { id }  = req.params;
    const resultado = await removeComorbidade(id)
    if(!resultado) return res.status(404).json({message: "Comorbidade não encontrada."});
    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar comorbidade.', error: err.message})
  }
}

module.exports = { postComorbidade, getComorbidade, putComorbidade, deleteComorbidade };