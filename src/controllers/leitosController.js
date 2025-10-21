const { createLeito, selectLeito, updateLeito, removeLeito } = require('../services/leitosService');

async function postLeito(req, res) {
  try {
    const { leito } = req.body;
    const resultado = await createLeito(leito);
    if (resultado.warning) {
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }
    return res.status(201).json({
      message: 'Leito criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar leito.',
      error: err.message
    });
  }
}

async function getLeito(req, res){
  try{
    const { codigo_leito } = req.query;
    const resultado = await selectLeito(codigo_leito);

    if(!resultado) return res.status(404).json({message: "Leito não encontrado"});
    return res.status(200).json( resultado )
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar leito.', error: err.message});
  }
}

async function putLeito(req, res){
  try{
    const { leito } = req.body;
    const resultado = await updateLeito( leito )

    if(!resultado) return res.status(404).json({message: "Leito não encontrado."});
    return res.status(200).json( resultado )
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar leito.', error: err.message})
  }
}

async function deleteLeito(req, res){
  try{
    const id  = Number(req.params.id);
    const resultado = await removeLeito(id)
    if(!resultado) return res.status(404).json({message: "Leito não encontrado."});
    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar leito.', error: err.message})
  }
}

module.exports = { postLeito, getLeito, putLeito, deleteLeito  };
