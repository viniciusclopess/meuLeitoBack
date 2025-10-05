const { createEnfermeira, selectEnfermeira, updateEnfermeira } = require('../services/enfermeirasService');

async function postEnfermeira(req, res) {
  try {
    const { pessoa, enfermeira } = req.body;

    const resultado = await createEnfermeira(pessoa, enfermeira);

    if (resultado.warning) {
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Enfermeira criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar enfermeira.',
      error: err.message
    });
  }
}

async function getEnfermeira(req, res){
  try{
    const { cpf } = req.body;
    const med = await selectEnfermeira(cpf);

    if(!med) return res.status(404).json({message: "Enfermeira não encontrada"});
    return res.status(200).json({ data: med })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar enfermeira.', error: err.message});
  }
}

async function putEnfermeira(req, res){
  try{
    const {cpf,  enfermeira = {}} = req.body;
    const med = await updateEnfermeira(cpf, enfermeira)

    if(!med) return res.status(404).json({message: "Enfermeira não encontrada"});
    return res.status(200).json({ data: med})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar enfermeira.', error: err.message})
  }
}

module.exports = { postEnfermeira, getEnfermeira, putEnfermeira };
