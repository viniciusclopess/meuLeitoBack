const { 
  insertPacienteLeito, selectPacienteLeito, updatePacienteLeito,
  insertProfissionalPermissao, selectProfissionalPermissao, updateProfissionalPermissao, removeProfissionalPermissao,
  insertProfissionaisSetores, selectProfissionaisSetores, updateProfissionaisSetores, removeProfissionaisSetores,
  insertPacienteAlergia, selectPacienteAlergia, updatePacienteAlergia, removePacienteAlergia,
  insertPacienteComorbidade, selectPacienteComorbidade, updatePacienteComorbidade, removePacienteComorbidade 

} = require('../services/joinsService');

async function postPacienteLeito(req, res) {
  try {
    const resultado = await insertPacienteLeito(req.body);
    if (resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }
    return res.status(201).json({
      ok: true,
      message: 'Alocação criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar atendimento.',
      error: err.message
    });
  }
}

async function getPacienteLeito(req, res){
  try{
    const { id_leito } = req.query;
    const resultado = await selectPacienteLeito(id_leito);
    if(!resultado) return res.status(404).json({
      message: "Alocação não encontrada."
    });
    return res.status(200).json({
      message: "Alocações encontradas:", 
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ 
        message: 'Erro ao buscar atendimento.', 
        error: err.message
      });
  }
}

async function putPacienteLeito(req, res){
  try{
    const { id } = req.params;
    const resultado = await updatePacienteLeito( id, req.body )
    if(!resultado) return res.status(404).json({
      message: "Alocação não encontrada."
    });
    return res.status(200).json({
      message: "Alocações atualizados:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao atualizar atendimento.', 
      error: err.message
    })
  }
}
//==================================================================================================================================
//==================================================================================================================================
async function postProfissionalPermissao(req, res) {
  try {
    const resultado = await insertProfissionalPermissao(req.body);
    if (resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }
    return res.status(201).json({
      ok: true,
      message: 'Permissão criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar permissão.',
      error: err.message
    });
  }
}

async function getProfissionalPermissao(req, res){
  try{
    const { nome } = req.query;
    const resultado = await selectProfissionalPermissao(nome);
    if(!resultado) return res.status(404).json({
      message: "Permissão não encontrada."
    });
    return res.status(200).json({
      message: "Permissões encontradas:", 
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ 
        message: 'Erro ao buscar permissão.', 
        error: err.message
      });
  }
}

async function putProfissionalPermissao(req, res){
  try{
    const { id } = req.params;
    const resultado = await updateProfissionalPermissao( id, req.body )
    if(!resultado) return res.status(404).json({
      message: "Permissão não encontrada."
    });
    return res.status(200).json({
      message: "Permissões atualizadas:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao atualizar permissão.', 
      error: err.message
    })
  }
}

async function deleteProfissionalPermissao(req, res){
  try{
    const { id } = req.params;
    const resultado = await removeProfissionalPermissao(id)
    if(!resultado) return res.status(404).json({
      message: "Permissão não encontrada."
    });
    return res.status(200).json({
      message: "Permissões removidas:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao deletar permissão.', 
      error: err.message
    })
  }
}

//==================================================================================================================================
//==================================================================================================================================

async function postProfissionaisSetores(req, res) {
  try {
    const resultado = await insertProfissionaisSetores(req.body);
    if (resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }
    return res.status(201).json({
      ok: true,
      message: 'Setorização criada com sucesso.',
      data: resultado
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar setorização.',
      error: err.message
    });
  }
}

async function getProfissionaisSetores(req, res){
  try{
    const { nome } = req.query;
    const resultado = await selectProfissionaisSetores(nome);
    if(!resultado) return res.status(404).json({
      message: "Setorização não encontrada."
    });
    return res.status(200).json({
      message: "Setorizações encontradas:", 
      data: resultado
    })
  } catch (err) {
    console.error(err);
    return res.status(400).json({ 
        message: 'Erro ao buscar setorização.', 
        error: err.message
      });
  }
}

async function putProfissionaisSetores(req, res){
  try{
    const { id } = req.params;
    const resultado = await updateProfissionaisSetores( id, req.body )
    if(!resultado) return res.status(404).json({
      message: "Setorização não encontrada."
    });
    return res.status(200).json({
      message: "Setorizações atualizadas:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao atualizar setorização.', 
      error: err.message
    })
  }
}

async function deleteProfissionaisSetores(req, res){
  try{
    const { id } = req.params;
    const resultado = await removeProfissionaisSetores(id)
    if(!resultado) return res.status(404).json({
      message: "Setorização não encontrada."
    });
    return res.status(200).json({
      message: "Setorizações removidas:", 
      data: resultado
    })
  } catch(err){
    console.error(err);
    return res.status(400).json({ 
      message: 'Erro ao deletar setorização.', 
      error: err.message
    })
  }
}

//==================================================================================================================================
//==================================================================================================================================

async function postPacienteAlergia(req, res) {
  try {
    const resultado = await insertPacienteAlergia(req.body);

    if (resultado && resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'Alergia vinculada ao paciente com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao vincular alergia ao paciente.',
      error: err.message
    });
  }
}

async function getPacienteAlergia(req, res) {
  try {
    const { nome } = req.query;
    const resultado = await selectPacienteAlergia(nome);

    if (!resultado || resultado.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Nenhum registro de alergia encontrado.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Relações paciente/alergia encontradas.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      ok: false,
      message: 'Erro ao buscar alergias do paciente.',
      error: err.message
    });
  }
}


async function putPacienteAlergia(req, res) {
  try {
    const { id } = req.params;
    const resultado = await updatePacienteAlergia(id, req.body);

    if (!resultado) {
      return res.status(404).json({
        ok: false,
        message: 'Relação paciente/alergia não encontrada.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Relação paciente/alergia atualizada com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      ok: false,
      message: 'Erro ao atualizar relação paciente/alergia.',
      error: err.message
    });
  }
}

async function deletePacienteAlergia(req, res) {
  try {
    const { id } = req.params;
    const resultado = await removePacienteAlergia(id);

    if (!resultado) {
      return res.status(404).json({
        ok: false,
        message: 'Relação paciente/alergia não encontrada.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Relação paciente/alergia removida com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);

    return res.status(400).json({
      ok: false,
      message: 'Erro ao remover relação paciente/alergia.',
      error: err.message
    });
  }
}


//==================================================================================================================================
//==================================================================================================================================

async function postPacienteComorbidade(req, res) {
  try {
    const resultado = await insertPacienteComorbidade(req.body);

    if (resultado && resultado.warning) {
      return res.status(409).json({
        ok: false,
        message: resultado.warning
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'Comorbidade vinculada ao paciente com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao vincular comorbidade ao paciente.',
      error: err.message
    });
  }
}

async function getPacienteComorbidade(req, res) {
  try {
    const { nome } = req.query;
    const resultado = await selectPacienteComorbidade(nome);

    if (!resultado || resultado.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Nenhum registro de comorbidade encontrado.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Relações paciente/comorbidade encontradas.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      ok: false,
      message: 'Erro ao buscar comorbidades do paciente.',
      error: err.message
    });
  }
}


async function putPacienteComorbidade(req, res) {
  try {
    const { id } = req.params;
    const resultado = await updatePacienteComorbidade(id, req.body);

    if (!resultado) {
      return res.status(404).json({
        ok: false,
        message: 'Relação paciente/comorbidade não encontrada.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Relação paciente/comorbidade atualizada com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      ok: false,
      message: 'Erro ao atualizar relação paciente/comorbidade.',
      error: err.message
    });
  }
}

async function deletePacienteComorbidade(req, res) {
  try {
    const { id } = req.params;
    const resultado = await removePacienteComorbidade(id);

    if (!resultado) {
      return res.status(404).json({
        ok: false,
        message: 'Relação paciente/comorbidade não encontrada.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Relação paciente/comorbidade removida com sucesso.',
      data: resultado
    });

  } catch (err) {
    console.error(err);

    return res.status(400).json({
      ok: false,
      message: 'Erro ao remover relação paciente/comorbidade.',
      error: err.message
    });
  }
}

module.exports = { 
  postPacienteLeito, getPacienteLeito, putPacienteLeito, 
  postProfissionalPermissao, getProfissionalPermissao, putProfissionalPermissao, deleteProfissionalPermissao,
  postProfissionaisSetores, getProfissionaisSetores, putProfissionaisSetores, deleteProfissionaisSetores,
  postPacienteAlergia, getPacienteAlergia, putPacienteAlergia, deletePacienteAlergia,
  postPacienteComorbidade, getPacienteComorbidade, putPacienteComorbidade, deletePacienteComorbidade
};
