exports.ensureAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
      return next(); // User is an admin, allow access
    } else {
      return res.redirect('/admin/login'); // Redirect to admin login if not logged in as admin
    }
  };