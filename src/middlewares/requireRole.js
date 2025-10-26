function requireRole(perfisPermitidos = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        ok: false, 
        message: 'Não autenticado' });
    }

    const perfilDoUsuario = req.user.IdPerfil;

    if (!perfisPermitidos.includes(perfilDoUsuario)) {
      return res.status(403).json({
        ok: false,
        message: 'Acesso negado: privilégio insuficiente'
      });
    }

    next();
  };
}

module.exports = requireRole;
