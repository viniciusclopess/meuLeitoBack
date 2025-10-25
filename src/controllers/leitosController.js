const { createLeito, listLeitos, updateLeito, removeLeito } = require('../services/leitosService');

const STATUS_PERMITIDOS = ['Livre', 'Ocupado', 'Em manutenção', 'Desativado'];

async function postLeito(req, res) {
  try {
    const { Nome, IdSetor, Status, Descricao } = req.body ?? {};

    // Regras básicas
    if (!Nome || !IdSetor) {
      return res.status(400).json({ message: 'Campos obrigatórios: Nome, IdSetor.' });
    }
    if (String(Nome).length > 15) {
      return res.status(400).json({ message: 'Nome deve ter no máximo 15 caracteres.' });
    }
    if (Status && !STATUS_PERMITIDOS.includes(Status)) {
      return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_PERMITIDOS.join(', ')}` });
    }

    const novo = await createLeito({ Nome, IdSetor, Status, Descricao });
    return res.status(201).json({ message: 'Leito criado com sucesso.', data: novo });

  } catch (err) {
    // Erros comuns do Postgres
    if (err.code === '23503') { // FK violation
      return res.status(400).json({ message: 'IdSetor inválido (setor não existe).', detail: err.detail });
    }
    if (err.code === '23514') { // CHECK violation
      return res.status(400).json({ message: 'Violação de regra (CHECK). Verifique o campo Status.' });
    }
    if (err.code === '22001') { // string data, right truncation
      return res.status(400).json({ message: 'Tamanho de campo excedido (ex.: Nome até 15 chars).' });
    }

    console.error('[POST /leitos] erro:', err);
    return res.status(500).json({ message: 'Erro ao criar leito.', error: err.message });
  }
}


async function getLeitos(req, res) {
  try {
    const { nome, status, idSetor, ativo } = req.query;

    const statuses = Array.isArray(status) ? status : status ? [status] : [];

    if (statuses.some(s => !STATUS_PERMITIDOS.includes(s))) {
      return res.status(400).json({
        message: `Status inválido. Use um de: ${STATUS_PERMITIDOS.join(', ')}`
      });
    }

    if (idSetor && isNaN(Number(idSetor))) {
      return res.status(400).json({ message: 'idSetor deve ser numérico.' });
    }

    let ativoBool = undefined;
    if (typeof ativo !== 'undefined') {
      if (ativo === 'true' || ativo === true) ativoBool = true;
      else if (ativo === 'false' || ativo === false) ativoBool = false;
      else return res.status(400).json({ message: 'ativo deve ser true ou false.' });
    }

    const data = await listLeitos({ nome, statuses, idSetor, ativo: ativoBool });
    return res.status(200).json({ data });

  } catch (err) {
    console.error('[GET /leitos] erro:', err);
    return res.status(500).json({ message: 'Erro ao listar leitos.', error: err.message });
  }
}


async function putLeito(req, res) {
  try {
    const { id } = req.params;
    const { Nome, Status, Ativo } = req.body ?? {};

    // nada para atualizar?
    if (typeof Nome === 'undefined' && typeof Status === 'undefined' && typeof Ativo === 'undefined') {
      return res.status(400).json({ message: 'Envie ao menos um campo: Nome, Status ou Ativo.' });
    }

    if (typeof Status !== 'undefined' && !STATUS_PERMITIDOS.includes(Status)) {
      return res.status(400).json({ message: `Status inválido. Use: ${STATUS_PERMITIDOS.join(', ')}` });
    }

    if (typeof Ativo !== 'undefined' && typeof Ativo !== 'boolean') {
      return res.status(400).json({ message: 'Ativo deve ser boolean (true/false).' });
    }

    const atualizado = await updateLeito(id, { Nome, Status, Ativo });
    if (!atualizado) return res.status(404).json({ message: 'Leito não encontrado.' });

    return res.status(200).json({ message: 'Leito atualizado com sucesso.', data: atualizado });

  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ message: 'Violação de regra (CHECK). Verifique o Status.' });
    }
    if (err.code === '22001') {
      return res.status(400).json({ message: 'Tamanho de campo excedido.' });
    }
    console.error('[PUT /leitos/:id] erro:', err);
    return res.status(500).json({ message: 'Erro ao atualizar leito.', error: err.message });
  }
}

async function deleteLeito(req, res) {
  try {
    const id = Number(req.params.id);
    const resultado = await removeLeito(id)
    if (!resultado) return res.status(404).json({ message: "Leito não encontrado." });
    return res.status(200).json(resultado)
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Erro ao deletar leito.', error: err.message })
  }
}

module.exports = { postLeito, getLeitos, putLeito, deleteLeito };
