const User = require('../models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Login logic
exports.getLogin = (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render('login');
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      console.log(user);
      req.session.userId = user._id;
      req.session.isAdmin = user.isAdmin;
      if (user.isAdmin) {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/');
      }
    } else {
      return res.render('login', { msg: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { msg: 'Error logging in. Please try again.' });
  }
};

// Signup logic
exports.getSignup = (req, res) => {
  res.render('signup');
};

// Signup logic
exports.postSignup = async (req, res) => {
  const { fullname, username, password, passwordConfirm, email } = req.body;
  const errors = [];

  // Full name validation (only alphabets and not just spaces)
  const nameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
  const trimmedFullname = fullname.trim();
  if (!nameRegex.test(trimmedFullname)) {
    errors.push('Name can only contain alphabets and spaces, no special characters or numbers.');
  }

  // Email validation (basic regex for email format)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim();
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Invalid email format.');
  }

  // Password validation
  const trimmedPassword = password.trim(); // Ensure no extra spaces
  const minLength = 8;
  const hasLowerCase = /[a-z]/;
  const hasUpperCase = /[A-Z]/;
  const hasNumber = /\d/;
  const hasSpecialChar = /[!@#$%^&*]/;

  if (trimmedPassword.length < minLength) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!hasLowerCase.test(trimmedPassword)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!hasUpperCase.test(trimmedPassword)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!hasNumber.test(trimmedPassword)) {
    errors.push('Password must contain at least one number.');
  }
  if (!hasSpecialChar.test(trimmedPassword)) {
    errors.push('Password must contain at least one special character (e.g., !@#$%^&*).');
  }

  // Password confirmation
  if (password !== passwordConfirm) {
    errors.push('Passwords do not match.');
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.render('signup', {
      errors, // Pass error messages to the view
      formData: { fullname, username, email }
    });
  }

  try {
    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email: trimmedEmail }] });

    if (existingUser) {
      // Handle the case where the username already exists
      if (existingUser.username === username) {
        errors.push('Username already exists. Please choose a different one.');
      }

      // Handle the case where the email already exists
      if (existingUser.email === trimmedEmail) {
        errors.push('Email already exists. Please use a different email.');
      }

      return res.render('signup', {
        errors,
        formData: { fullname, username, email }
      });
    }

    // Save new user
    const user = new User({
      fullname: trimmedFullname,
      username,
      email: trimmedEmail,
      password: trimmedPassword, // Password hashing is handled in the pre-save middleware
      isAdmin: false,
    });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    // Catch any unexpected errors
    console.error('Signup error:', err);
    res.render('signup', {
      errors: ['An error occurred during signup. Please try again.'],
      formData: { fullname, username, email }
    });
  }
};

// Logout logic
exports.getLogout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

// Home logic
exports.getHome = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  try {
    // Check if the userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.session.userId)) {
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect('/login');
    }

    if (user.isAdmin) {
      res.redirect('/admin/dashboard');
    } else {
      res.render('home', { fullname: user.fullname });
    }
  } catch (err) {
    console.error('Home page error:', err);
    res.redirect('/login');
  }
};

