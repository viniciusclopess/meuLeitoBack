const { createPessoa, selectPessoa, updatePessoa, removePessoa } = require('../services/pessoasService');

async function postPessoa(req, res) {
  try {
    const resultado = await createPessoa(req.body);
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

async function getPessoa(req, res) {
  try {
    const { nome } = req.query;
    const resultado = await selectPessoa(nome);
    if (!resultado) return res.status(404).json({ message: "Pessoa não encontrada" });
    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar pessoa.' });
  }
}

async function putPessoa(req, res) {
  try {
    const { pessoa } = req.body;
    const resultado = await updatePessoa(pessoa)

    if (!resultado) return res.status(404).json({ message: "Pessoa não encontrada." });
    return res.status(200).json({ data: resultado })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar pessoa.', error: err.message })
  }
}

async function deletePessoa(req, res) {
  try {
    const id = Number(req.params.id);
    const resultado = await removePessoa(id)
    if (!resultado) return res.status(404).json({ message: "Pessoa não encontrada" });
    return res.status(200).json(resultado)
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar pessoa.', error: err.message })
  }
}

module.exports = { postPessoa, getPessoa, putPessoa, deletePessoa };