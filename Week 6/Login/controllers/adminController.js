const User = require('../models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose'); // Ensure mongoose is required

// Admin login logic
exports.getAdminLogin = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin-login');
};

exports.postAdminLogin = (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.userId = 'admin'; // Update this to use actual ObjectId if needed
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  } else {
    return res.render('admin-login', { msg: 'Invalid credentials' });
  }
};

// Dashboard logic
exports.getAdminDashboard = async (req, res) => {
  if (req.session.isAdmin) {
    try {
      const users = await User.find();
      res.render('admin-dashboard', { users });
    } catch (err) {
      res.redirect('/admin/login');
    }
  } else {
    res.redirect('/admin/login');
  }
};

// Create user logic
exports.getCreateUser = (req, res) => {
  res.render('create-user');
};

exports.postCreateUser = async (req, res) => {
  const { username, password, passwordConfirm, email, fullname } = req.body;
  const errors = [];

  // Full name and email validation (already covered in previous code)
  const nameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedFullname = fullname.trim();
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  if (!nameRegex.test(trimmedFullname)) errors.push('Name can only contain alphabets and spaces.');
  if (!emailRegex.test(trimmedEmail)) errors.push('Invalid email format.');

  // Password validation
  if (trimmedPassword.length < 8) errors.push('Password must be at least 8 characters long.');
  if (!/[a-z]/.test(trimmedPassword)) errors.push('Password must contain at least one lowercase letter.');
  if (!/[A-Z]/.test(trimmedPassword)) errors.push('Password must contain at least one uppercase letter.');
  if (!/\d/.test(trimmedPassword)) errors.push('Password must contain at least one number.');
  if (!/[!@#$%^&*]/.test(trimmedPassword)) errors.push('Password must contain at least one special character.');

  if (password !== passwordConfirm) errors.push('Passwords do not match.');

  if (errors.length > 0) {
    return res.render('create-user', { errors, formData: { fullname, username, email } });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email: trimmedEmail }] });
    if (existingUser) {
      if (existingUser.username === username) errors.push('Username already exists.');
      if (existingUser.email === trimmedEmail) errors.push('Email already exists.');
      return res.render('create-user', { errors, formData: { fullname, username, email } });
    }

    const user = new User({ fullname: trimmedFullname, username, password: trimmedPassword, email: trimmedEmail, isAdmin: false });
    await user.save();
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Error creating user:', err);
    res.render('create-user', { errors: ['Error creating user. Please try again.'], formData: { fullname, username, email } });
  }
};

// Edit user logic
exports.getEditUser = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.redirect('/admin/dashboard');
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.redirect('/admin/dashboard');
    }
    res.render('admin-edit', { user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.redirect('/admin/dashboard');
  }
};

exports.postEditUser = async (req, res) => {
  console.log('POST /admin/edit/:id called');
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.redirect('/admin/dashboard');
  }

  const { username, email, password, passwordConfirm, fullname } = req.body;
  const errors = [];

  const nameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedFullname = fullname.trim();
  const trimmedEmail = email.trim();
  const trimmedPassword = password ? password.trim() : '';
  
  if (!nameRegex.test(trimmedFullname)) errors.push('Name can only contain alphabets and spaces.');
  if (!emailRegex.test(trimmedEmail)) errors.push('Invalid email format.');

  if (trimmedPassword.length < 8) errors.push('Password must be at least 8 characters long.');
  if (password && !/[a-z]/.test(trimmedPassword)) errors.push('Password must contain at least one lowercase letter.');
  if (password && !/[A-Z]/.test(trimmedPassword)) errors.push('Password must contain at least one uppercase letter.');
  if (password && !/\d/.test(trimmedPassword)) errors.push('Password must contain at least one number.');
  if (password && !/[!@#$%^&*]/.test(trimmedPassword)) errors.push('Password must contain at least one special character.');

  if (password && password !== passwordConfirm) errors.push('Passwords do not match.');

  if (errors.length > 0) {
    return res.render('admin-edit', { errors, user: req.body });
  }

  try {
    const updateData = { username, email: trimmedEmail, fullname: trimmedFullname };
    if (password) {
      updateData.password = await bcrypt.hash(trimmedPassword, 10);
    }

    const existingUser = await User.findOne({ _id: { $ne: id }, $or: [{ username }, { email: trimmedEmail }] });
    if (existingUser) {
      if (existingUser.username === username) errors.push('Username already exists.');
      if (existingUser.email === trimmedEmail) errors.push('Email already exists.');
      return res.render('admin-edit', { errors, user: req.body });
    }

    await User.findByIdAndUpdate(id, updateData);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Error updating user:', err);
    res.render('admin-edit', { errors: ['Error updating user. Please try again.'], user: req.body });
  }
};

// Delete user logic
exports.postDeleteUser = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.redirect('/admin/dashboard');
  }

  try {
    await User.findByIdAndDelete(id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.redirect('/admin/dashboard');
  }
};

// Search users logic
exports.getSearchUser = async (req, res) => {
  const query = req.query.query || '';
  try {
    const users = query
      ? await User.find({
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        })
      : await User.find({});
    res.render('admin-dashboard', { users, query });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.render('admin-dashboard', { users: [], msg: 'Error fetching users. Please try again.' });
  }
};

// Logout logic
exports.getAdminLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/admin/login');
  });
};
