const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path if necessary
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables

const createOrUpdateAdmin = async () => {
  try {
    const admin = await User.findOne({ username: process.env.ADMIN_USERNAME});
    if (admin) {
      // Admin exists, update the password
      admin.password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await admin.save();
     console.log('Admin password updated');
    } else {
      // Admin does not exist, create a new admin
      const newAdmin = new User({
        username: process.env.ADMIN_USERNAME,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        isAdmin: true,
        email: process.env.ADMIN_EMAIL // Make sure to include this if it's a required field
      });
      await newAdmin.save();
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error creating or updating admin user:', error);
  }
};
console.log();


module.exports = createOrUpdateAdmin;
