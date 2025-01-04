const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Order =require("../../models/orderSchema")
const Wallet =require("../../models/walletSchema")
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const mongoose = require("mongoose");
const PDFDocument = require('pdfkit');
const fs = require('fs');

const userProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login'); // Redirect if no user session
        }

        const userData = await User.findById(userId);
        const addresses = await Address.find({ userId });
        
        
        const orders = await Order.find({ user: userData._id });


        const wallet = await Wallet.findOne({ user: userData._id }).populate('transactions.from transactions.to', 'name email'); 

        const walletHistory = wallet ? wallet.transactions : [];
        const walletBalance = wallet ? wallet.balance : 0;

        // Fetch wallet-based orders
        const walletOrders = await Order.find({ user: userId, paymentMethod: 'Wallet' })

        
        const walletOrderTransactions = walletOrders.map(order => ({
            _id: order._id,
            transactionType: 'wallet-order',
            amount: order.finalAmount,
            createdAt: order.invoiceDate,
            status: 'Completed'
        }))

        //console.log(walletOrderTransactions)
        
        const combinedWalletHistory = [...walletHistory, ...walletOrderTransactions];

        const sortedWalletHistory = combinedWalletHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.render('profile', {
            user: userData,
            addresses,
            orders,
            walletHistory: sortedWalletHistory,
            walletBalance,
            currentPage: 'profile',
        });
    } catch (error) {
        console.error("Error retrieving profile data:", error);
        res.redirect("/pageNotFound");
    }
};

const getEditProfile = async (req, res) => {
    try {
        // Check if the user is logged in
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login'); // Redirect if no user session
        }

        // Find user data by user ID
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found:", userId);
            return res.redirect("/pageNotFound"); // Handle case where user is not found
        }

        // Render the edit profile page, passing the user data
        res.render('editProfile', {
            user, // Pass user data to the view
            currentPage: 'profile',
            message: null
        });
    } catch (error) {
        console.error("Error retrieving user data for edit profile:", error);
        res.redirect("/pageNotFound"); // Redirect on error
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user; // Get user ID from session
        if (!userId) {
            console.error("User is not authenticated.");
            return res.json({ success: false, message: 'User is not authenticated.' });
        }

        const { name, phone } = req.body;

       

        // Update user details in the database
        const updatedUser = await User.findByIdAndUpdate(userId, { name, phone }, { new: true });

        if (!updatedUser) {
            console.error("User not found:", userId);
            return res.json({ success: false, message: 'User not found.' });
        }

        // Log updated user for verification
       // console.log("Updated user details:", updatedUser);
        res.json({ success: true, message: 'Profile updated successfully!' });
    } catch (error) {
        console.error("Error updating profile:", error); // Log the error for debugging
        res.json({ success: false, message: 'An error occurred while updating the profile.' });
    }
};


module.exports = {
    getEditProfile,
    updateProfile,
    userProfile, 
}