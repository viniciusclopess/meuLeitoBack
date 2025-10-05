const { createLeito, selectLeito, updateLeito } = require('../services/leitosService');

async function postLeito(req, res) {
  try {
    const { leitoBody } = req.body;

    const resultado = await createLeito(leitoBody);

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
    const { codigo_leito } = req.body;
    const leito = await selectLeito(codigo_leito);

    if(!leito) return res.status(404).json({message: "Leito não encontrado"});
    return res.status(200).json({ data: leito })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar leito.', error: err.message});
  }
}

async function putLeito(req, res){
  try{
    const {codigo_leito, leitoBody = {}} = req.body;
    const leito = await updateLeito(codigo_leito, leitoBody)

    if(!leito) return res.status(404).json({message: "Leito não encontrado"});
    return res.status(200).json({ data: leito})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar leito.', error: err.message})
  }
}

module.exports = { postLeito, getLeito, putLeito };
