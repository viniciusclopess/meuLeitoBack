const { insertPermissao, selectPermissao, updatePermissao, removePermissao } = require('../services/permissoesService');

async function postPermissao(req, res) {
  try {
    const resultado = await insertPermissao(req.body);
    if (resultado.warning) { 
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }
    return res.status(201).json({
      message: 'Permissão criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar permissão.',
      error: err.message
    });
  }
}

async function getPermissao(req, res){
  try{
    const { nome } = req.query; 
    const resultado = await selectPermissao(nome);
    if(!resultado) return res.status(404).json({
      message: "Permissão não encontrada."
    });
    return res.status(200).json({
      message: "Permissões encontradas:", data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao buscar permissão.', error: err.message
    });
  }
}

async function putPermissao(req, res){
  try{
    const { id } = req.params; 
    const resultado = await updatePermissao(id, req.body)
    if(!resultado) return res.status(404).json({
      message: "Permissão não encontrada."
    });
    return res.status(200).json({
      message: "Permissões atualizadas:", data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({
      message: 'Erro ao atualizar permissão.', error: err.message
    })
  }
}

async function deletePermissao(req, res){
  try{
    const { id }  = req.params;
    const resultado = await removePermissao(id)
    if(!resultado) return res.status(404).json({
      message: "Permissão não encontrada."
    });
    return res.status(200).json({
      message: "Permissões deletadas:", data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({
      message: 'Erro ao deletar permissão.', error: err.message
    })
  }
}

module.exports = { postPermissao, getPermissao, putPermissao, deletePermissao };