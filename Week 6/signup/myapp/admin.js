const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables

// Admin Login Route
router.get('/login', (req, res) => res.render('admin-login'));
router.post('/login', async (req, res) => {
    console.log('Admin login route hit');
  const { username, password } = req.body;
  console.log('Admin login attempt:', { username, password });
  // Check if the username and password match the environment variables
  if (
    username == process.env.ADMIN_USERNAME &&
    password == process.env.ADMIN_PASSWORD
  ) {
    req.session.userId = 'admin'; // Assign a unique identifier for the admin
    req.session.isAdmin = true;
    console.log('Admin logged in successfully');
    return res.redirect('/admin/dashboard');
  } else {
    console.log('Invalid credentials');
    return res.render('admin-login', { msg: 'Invalid credentials' });
  }
});

// Admin Logout Route
router.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;
