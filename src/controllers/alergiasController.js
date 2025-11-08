const { insertAlergia, selectAlergia, updateAlergia, removeAlergia } = require('../services/alergiasService');

async function postAlergia(req, res) {
  try {
    const resultado = await insertAlergia(req.body);
    if (resultado.warning) { 
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }
    return res.status(201).json({
      message: 'Alergia criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar alergia.',
      error: err.message
    });
  }
}

async function getAlergia(req, res) {
  try {
    const { nome, page, pageSize } = req.query;
    const result = await selectAlergia({ nome, page, pageSize });

    if (!result || (Array.isArray(result.data) && result.data.length === 0)) {
      return res.status(404).json({
        message: "Alergia não encontrada.",
        data: []
      });
    }

    return res.status(200).json({
      message: "Alergias encontradas",
      ...result
    });
  } catch (err) {
    console.error('Erro em getAlergia:', err);
    return res.status(500).json({
      message: 'Erro ao buscar alergia.',
      error: err.message
    });
  }
}

async function putAlergia(req, res){
  try{
    const { id } = req.params; 
    const resultado = await updateAlergia(id, req.body)
    if(!resultado) return res.status(404).json( {message: "Alergia não encontrada."} );
    return res.status(200).json( {message: "Alergias atualizadas:", data: resultado} )
  } catch(err){
    console.error(err);
    return res.status(400).json( { message: 'Erro ao atualizar alergia.', error: err.message} )
  }
}

async function deleteAlergia(req, res){
  try{
    const { id }  = req.params;
    const resultado = await removeAlergia(id)
    if(!resultado) return res.status(404).json({message: "Alergia não encontrada."});
    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar alergia.', error: err.message})
  }
}

module.exports = { postAlergia, getAlergia, putAlergia, deleteAlergia };