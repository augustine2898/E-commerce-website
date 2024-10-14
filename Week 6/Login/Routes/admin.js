const express = require('express');
const adminrouter = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/auth');

// Admin Login Routes
adminrouter.get('/login', adminController.getAdminLogin);
adminrouter.post('/login', adminController.postAdminLogin);

// Protect these routes with the ensureAdmin middleware
adminrouter.use(ensureAdmin); // This applies to all routes below this line

// Admin Dashboard
adminrouter.get('/dashboard', adminController.getAdminDashboard);

// Create User Routes
adminrouter.get('/create', adminController.getCreateUser);
adminrouter.post('/create', adminController.postCreateUser);

// Edit User Routes
adminrouter.get('/edit/:id', adminController.getEditUser);
adminrouter.post('/edit/:id', adminController.postEditUser);

// Delete User Route
adminrouter.post('/delete/:id', adminController.postDeleteUser);

// Search Users Route
adminrouter.get('/search', adminController.getSearchUser);

// Admin Logout Route
adminrouter.get('/logout', adminController.getAdminLogout);

module.exports = adminrouter;
