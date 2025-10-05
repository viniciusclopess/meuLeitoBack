const { createSetor, selectSetor, updateSetor } = require('../services/setoresService');

async function postSetor(req, res) {
  try {
    const { setor } = req.body;

    const resultado = await createSetor(setor);

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
    const { codigo_setor } = req.body;
    const setor = await selectSetor(codigo_setor);

    if(!setor) return res.status(404).json({message: "Setor não encontrado"});
    return res.status(200).json({ data: setor })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar setor.', error: err.message});
  }
}

async function putSetor(req, res){
  try{
    const { codigo_setor, setor = {}} = req.body;
    const setorBody = await updateSetor(codigo_setor, setor)

    if(!setorBody) return res.status(404).json({message: "Setor não encontrado"});
    return res.status(200).json({ data: setorBody})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar setor.', error: err.message})
  }
}

module.exports = { postSetor, getSetor, putSetor };