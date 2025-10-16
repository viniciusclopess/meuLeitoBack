const { insertChamado, listarPorSetorEStatus, aceitarChamado, finalizarChamado } = require('../services/chamadosService');

async function postChamado(req, res) {
  try {
    const { chamadoBody } = req.body;

    const resultado = await insertChamado(chamadoBody);

    if (resultado.warning) {
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Chamado criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar chamado.',
      error: err.message
    });
  }
}

async function getChamado(req, res){
  try{
    const { id_setor, status } = req.body;
    const chamados = await listarPorSetorEStatus(id_setor, status);

    if(!chamados) return res.status(404).json({message: "Chamados não encontrados"});
    return res.status(200).json({ data: chamados })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar chamados.', error: err.message});
  }
}

async function putAceitarChamado(req, res){
  try{
    const {id_chamado, id_enfermeira} = req.body;
    const chamado = await aceitarChamado(id_chamado, id_enfermeira)

    if(!chamado) return res.status(404).json({message: "Chamado não encontrado"});
    return res.status(200).json({ data: chamado})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar chamado.', error: err.message})
  }
}

async function putFinalizarChamado(req, res){
  try{
    const {id_chamado, id_enfermeira} = req.body;
    const chamado = await finalizarChamado(id_chamado, id_enfermeira)

    if(!chamado) return res.status(404).json({message: "Chamado não encontrado"});
    return res.status(200).json({ data: chamado})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar chamado.', error: err.message})
  }
}


module.exports = { postChamado, getChamado, putAceitarChamado, putFinalizarChamado };
