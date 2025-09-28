const { createPessoaPorCPF, getPessoaPorCPF, updatePessoaPorCPF } = require('../services/pessoasService');

async function createPessoa(req, res) {
  try {
    const { pessoa, usuario } = req.body;

    const resultado = await createPessoaPorCPF(pessoa, usuario);

    if (resultado.warning) { 
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }

    return res.status(201).json({
      message: 'Pessoa criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar pessoa.',
      error: err.message
    });
  }
}

async function getPessoa(req, res){
  try{
    const { login } = req.body;
    const user = await getPessoaPorCPF(login);

    if(!user) return res.status(404).json({message: "Pessoa não encontrada."});
    return res.status(200).json({ data: user })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar pessoa.', error: err.message});
  }
}

async function updatePessoa(req, res){
  try{
    const { usuario = {}} = req.body;
    const user = await updatePessoaPorCPF(usuario)

    if(!user) return res.status(404).json({message: "Pessoa não encontrada."});
    return res.status(200).json({ data: user})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar pessoa.', error: err.message})
  }
}

module.exports = { createPessoa, getPessoa, updatePessoa };