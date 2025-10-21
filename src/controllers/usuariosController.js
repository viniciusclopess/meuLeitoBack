const { insertUsuario, selectUsuario, updateUsuario, removeUsuario } = require('../services/usuariosService');

async function postUsuario(req, res) {
  try {
    const { usuario } = req.body;
    const resultado = await insertUsuario( usuario );
    if (resultado.warning) { 
      return res.status(200).json({
        message: resultado.warning,
        data: resultado
      });
    }
    return res.status(201).json({
      message: 'Usuário criado com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Erro ao criar usuário.',
      error: err.message
    });
  }
}

async function getUsuario(req, res) {
  try {
    const { nome } = req.query;
    const resultado = await selectUsuario(nome);
    if(!resultado) return res.status(404).json({message: "Usuario não encontrado."});
    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar usuário.' });
  }
}

async function putUsuario(req, res){
  try{
    const { usuario } = req.body;
    const resultado = await updateUsuario(usuario)
    if(!resultado) return res.status(404).json({message: "Usuário não encontrado."});
    return res.status(200).json( resultado )
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar usuário.', error: err.message})
  }
}

async function deleteUsuario(req, res){
  try{
    const id  = Number(req.params.id);
    const resultado = await removeUsuario(id)
    if(!resultado) return res.status(404).json({message: "Usuário não encontrado."});
    return res.status(200).json(resultado)
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar usuário.', error: err.message})
  }
}

module.exports = { postUsuario, getUsuario, putUsuario, deleteUsuario };