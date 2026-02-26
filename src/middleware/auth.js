function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    return res.redirect('/admin/login');
  }
  return next();
}

module.exports = { requireAdmin };
