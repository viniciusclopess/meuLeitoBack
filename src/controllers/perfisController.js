const { insertPerfil, selectPerfil, updatePerfil, removePerfil } = require('../services/perfisService');

async function postPerfil(req, res) {
  try {
    const resultado = await insertPerfil(req.body);
    if (resultado.warning) { 
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }
    return res.status(201).json({
      message: 'Perfil criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar perfil.',
      error: err.message
    });
  }
}

async function getPerfil(req, res){
  try{
    const { nome } = req.query; 
    const resultado = await selectPerfil(nome);
    if(!resultado) return res.status(404).json( {message: "Perfil não encontrado."} );
    return res.status(200).json( {message: "Perfis encontrados:", data: resultado} )
  } catch (err) {
    console.error(err);
    return res.status(400).json( { message: 'Erro ao buscar perfil.', error: err.message} );
  }
}

async function putPerfil(req, res){
  try{
    const { id } = req.params; 
    const resultado = await updatePerfil(id, req.body)
    if(!resultado) return res.status(404).json( {message: "Perfil não encontrado."} );
    return res.status(200).json( {message: "Perfis atualizadas:", data: resultado} )
  } catch(err){
    console.error(err);
    return res.status(400).json( { message: 'Erro ao atualizar perfil.', error: err.message} )
  }
}

async function deletePerfil(req, res){
  try{
    const { id }  = req.params;
    const resultado = await removePerfil(id)
    if(!resultado) return res.status(404).json({message: "Perfil não encontrado."});
    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar perfil.', error: err.message})
  }
}

module.exports = { postPerfil, getPerfil, putPerfil, deletePerfil };