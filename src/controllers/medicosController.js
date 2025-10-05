const { createMedico, selectMedico, updateMedico } = require('../services/medicosService');

async function postMedico(req, res) {
  try {
    const { pessoa, medico } = req.body;

    const resultado = await createMedico(pessoa, medico);

    if (resultado.warning) {
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Médico criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar médico.',
      error: err.message
    });
  }
}

async function getMedico(req, res){
  try{
    const { cpf } = req.body;
    const med = await selectMedico(cpf);

    if(!med) return res.status(404).json({message: "Médico não encontrado"});
    return res.status(200).json({ data: med })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar médico.', error: err.message});
  }
}

async function putMedico(req, res){
  try{
    const {cpf,  medico = {}} = req.body;
    const med = await updateMedico(cpf, medico)

    if(!med) return res.status(404).json({message: "Médico não encontrado"});
    return res.status(200).json({ data: med})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar médico.', error: err.message})
  }
}

module.exports = { postMedico, getMedico, putMedico };
