const { createPacienteComPessoa, getPacientePorCPF, updatePacientePorCPF } = require('../services/pacientesService');

async function criarPaciente(req, res) {
  try {
    const { pessoa, paciente } = req.body;

    const resultado = await createPacienteComPessoa(pessoa, paciente);

    if (resultado.warning) {
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Paciente criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar paciente.',
      error: err.message
    });
  }
}

async function getPaciente(req, res){
  try{
    const { cpf } = req.body;
    const pac = await getPacientePorCPF(cpf);

    if(!pac) return res.status(404).json({message: "Paciente não encontrado"});
    return res.status(200).json({ data: pac })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro as buscar paciente.', error: err.message});
  }
}

async function updatePaciente(req, res){
  try{
    const {cpf,  paciente = {}} = req.body;
    const pac = await updatePacientePorCPF(cpf, paciente)

    if(!pac) return res.status(404).json({message: "Paciente não encontrado"});
    return res.status(200).json({ data: pac})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar paciente.', error: err.message})
  }
}

module.exports = { criarPaciente, getPaciente, updatePaciente };
