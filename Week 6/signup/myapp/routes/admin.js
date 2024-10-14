const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Admin Login Route
router.get('/login', (req, res) => res.render('admin-login'));
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, isAdmin: true });
  if (!user || !(await user.comparePassword(password))) {
    return res.render('admin-login', { msg: 'Invalid credentials' });
  }
  req.session.userId = user._id;
  req.session.isAdmin = true;
  res.redirect('/admin');
});

// Admin Dashboard
router.get('/', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin/login');
  const users = await User.find();
  res.render('admin-dashboard', { users });
});

// Edit, Delete, and Search Users
// Implement similar to login/signup, with proper validation
// ...

module.exports = router;
