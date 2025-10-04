const { createUsuarioPorCPF, getUsuarioPorLogin, updateUsuarioPorLogin } = require('../services/usuariosService');

async function createUsuario(req, res) {
  try {
    const { pessoa, usuario } = req.body;

    const resultado = await createUsuarioPorCPF(pessoa, usuario);

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
    const user = await getUsuarioPorLogin(login);

    if(!user) return res.status(404).json({message: "Usuário não encontrado"});
    return res.status(200).json({ data: user })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao buscar usuário.', error: err.message});
  }
}

async function updateUsuario(req, res){
  try{
    const { usuario = {}} = req.body;
    const user = await updateUsuarioPorLogin(usuario)

    if(!user) return res.status(404).json({message: "Usuário não encontrado"});
    return res.status(200).json({ data: user})
  } catch(err){
    console.error(err);
    return res.status(400).json({ message: 'Erro ao atualizar usuário.', error: err.message})
  }
}

module.exports = { createUsuario, getUsuario, updateUsuario };