const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Signup Routes
router.get('/signup', userController.getSignup);
router.post('/signup', userController.postSignup);

// Login Routes
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);

// Logout Route
router.get('/logout', userController.getLogout);

// Home Route
router.get('/', userController.getHome);

module.exports = router;
