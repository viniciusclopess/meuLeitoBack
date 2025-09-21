const { createMedicoComPessoa, getMedicoPorCPF, updateMedicoPorCPF } = require('../services/medicosService');

async function criarMedico(req, res) {
  try {
    const { pessoa, medico } = req.body;

    const resultado = await createMedicoComPessoa(pessoa, medico);

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
    const med = await getMedicoPorCPF(cpf);

    if(!med) return res.status(404).json({message: "Médico não encontrado"});
    return res.status(200).json({ data: med })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro as buscar médico.', error: err.message});
  }
}

async function updateMedico(req, res){
  try{
    const {cpf,  medico = {}} = req.body;
    const med = await updateMedicoPorCPF(cpf, medico)

    if(!med) return res.status(404).json({message: "Médico não encontrado"});
    return res.status(200).json({ data: med})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar médico.', error: err.message})
  }
}

module.exports = { criarMedico, getMedico, updateMedico };
