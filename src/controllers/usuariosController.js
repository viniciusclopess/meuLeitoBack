const { createUsuario, selectUsuario, updateUsuario } = require('../services/usuariosService');

async function postUsuario(req, res) {
  try {
    const { pessoa, usuario } = req.body;

    const resultado = await createUsuario(pessoa, usuario);

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

async function getUsuario(req, res){
  try{
    const { login } = req.body;
    const user = await selectUsuario(login);

    if(!user) return res.status(404).json({message: "Usuário não encontrado"});
    return res.status(200).json({ data: user })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar usuário.', error: err.message});
  }
}

async function putUsuario(req, res){
  try{
    const { usuario = {}} = req.body;
    const user = await updateUsuario(usuario)

    if(!user) return res.status(404).json({message: "Usuário não encontrado"});
    return res.status(200).json({ data: user})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar usuário.', error: err.message})
  }
}

module.exports = { postUsuario, getUsuario, putUsuario };