const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Signup Route
router.get('/signup', (req, res) => res.render('signup'));
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    res.render('signup', { msg: 'Error signing up' });
  }
});

// Login Route
router.get('/login', (req, res) => res.render('login'));
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.render('login', { msg: 'Invalid username or password' });
  }
  req.session.userId = user._id;
  req.session.isAdmin = user.isAdmin;
  res.redirect('/');
});

// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Home Route
router.get('/', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('home');
});

module.exports = router;
