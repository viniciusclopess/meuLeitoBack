const { createPessoa, selectPessoa, updatePessoa } = require('../services/pessoasService');

async function postPessoa(req, res) {
  try {
    const { pessoa, usuario } = req.body;

    const resultado = await createPessoa(pessoa, usuario);

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
    const { nome } = req.body;
    const user = await selectPessoa(nome);

    if (!user) return res.status(404).json({ message: "Pessoa não encontrada." });
    return res.status(200).json({ data: user })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar pessoa.', error: err.message });
  }
}

async function putPessoa(req, res) {
  try {
    const { usuario = {} } = req.body;
    const user = await updatePessoa(usuario)

    if (!user) return res.status(404).json({ message: "Pessoa não encontrada." });
    return res.status(200).json({ data: user })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar pessoa.', error: err.message })
  }
}

module.exports = { postPessoa, getPessoa, putPessoa };