function requirePermissao(permissaoNecessaria) {
  return (req, res, next) => {
    // precisa ter passado antes pelo autenticarJWT
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: 'Não autenticado.'
      });
    }

    const permissoesProfissional = req.user.permissoes;

    if (
      !Array.isArray(permissoesProfissional) ||
      !permissoesProfissional.includes(permissaoNecessaria)
    ) {
      return res.status(403).json({
        ok: false,
        message: 'Acesso negado. Permissão insuficiente.'
      });
    }

    return next();
  };
}

module.exports = {
  requirePermissao,
};
