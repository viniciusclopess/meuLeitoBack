const { createPessoa, selectPessoa, updatePessoa } = require('../services/pessoasService');

async function postPessoa(req, res) {
  try {
    const { pessoaBody } = req.body;

    const pessoa = await createPessoa(pessoaBody);

    if (pessoa.warning) { 
      return res.status(200).json({
        message: pessoa.warning,
        data: pessoa
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
    const { nome } = req.body;
    const pessoa = await selectPessoa(nome);

    if(!pessoa) return res.status(404).json({message: "Pessoa não encontrada."});
    return res.status(200).json({ data: pessoa })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar pessoa.', error: err.message});
  }
}

async function putPessoa(req, res){
  try{
    const { pessoaBody = {}} = req.body;
    const pessoa = await updatePessoa(pessoaBody)

    if(!pessoa) return res.status(404).json({message: "Pessoa não encontrada."});
    return res.status(200).json({ data: pessoa})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar pessoa.', error: err.message})
  }
}

module.exports = { postPessoa, getPessoa, putPessoa };