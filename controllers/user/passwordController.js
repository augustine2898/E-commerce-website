const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const mongoose = require("mongoose");
const PDFDocument = require('pdfkit');
const fs = require('fs');

const changePass = async (req, res) => {
    try {
        const message = req.session.message || null;
        req.session.message = null;

        const userId = req.session.user;
        if (!userId) {
            // Redirect to login if userId is not found
            return res.redirect("/login");
        }

        const user = await User.findById(userId);
        if (!user) {
            // If no user found, redirect to login
            return res.redirect("/login");
        }

        // Render the change password page
        res.render("change-password", {
            currentPage: 'profile',
            user,
            message: message
        });
    } catch (error) {
        console.error("Error in changePass:", error);  // Add error logging
        res.redirect("/pageNotFound");
    }
}

const changePasswordValid =async(req,res)=>{
    try {
        const {email} =req.body;
        const userExists =await User.findOne({email});
        if(userExists){
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp);
            if(emailSent){
                req.session.userOtp = otp;
                req.session.userData =req.body;
                req.session.email = email;
                req.session.otpTimestamp = Date.now();
                let user = null;
                let userId=req.session.user
                user = await User.findById(userId);
                res.render("change-password-otp",{
                    currentPage: 'profile',
                    user,
                    message: null
                });
                console.log('OTP',otp);
            }else{
                req.session.message = "Error sending email."; // Set error message in session
                res.redirect('/change-password'); 
            }
        }else{
            req.session.message = "User with this email does not exist"; // Set message for non-existing user
            res.redirect('/change-password');
        }
    } catch (error) {
        console.log("Error in changing password validation",Error);
        res.redirect("/pageNotFound")
    }
}

const verifyChangePassOtp =async(req,res)=>{
    try {
        const { otp } = req.body;
        const currentTime = Date.now();
        console.log("Received OTP:", otp);
        console.log("Session OTP:", req.session.userOtp);
        console.log("OTP Timestamp:", req.session.otpTimestamp);
        console.log("Current Time:", currentTime);

        if (!req.session.otpTimestamp || currentTime > req.session.otpTimestamp + OTP_EXPIRATION_TIME) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        if (otp === req.session.userOtp) {
            res.json({
                success: true, redirectUrl: "/reset-password"
            });

        } else {
            return res.status(400).json({ success: false, message: "OTP not matching. Please try again." });
        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        return res.status(500).json({ success: false, message: "An error occurred. Please try again." });
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {

    }
}

const postNewPassword = async (req, res) => {
    try {
        const { newPass1, newPass2 } = req.body;
        const email = req.session.email;
        if (newPass1 === newPass2) {
            const passwordHash = await securePassword(newPass1);
            await User.updateOne(
                { email: email },
                { $set: { password: passwordHash } }
            )
            res.redirect("/login")
        } else {
            res.render("reset-password", { message: 'Passwords do not match' });
        }
    } catch {
        res.redirect("/pageNotFound");
    }

}
const getForgotPassPage = async (req, res) => {
    try {
        res.render("forgot-password", { message: null })
    } catch (error) {
        console.error("Error getting forgot password page", error);
        return false;
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const OTP_EXPIRATION_TIME = 1 * 60 * 1000;

const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Your OTp for password rest",
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP: ${otp}</h4></b>`
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("email sent :", info.response);
        return true;

    } catch (error) {

        console.error("Error sending email", error);
        return false;

    }
}

const resendOtp = async (req, res) => {
    try {
        const email = req.session.email;
        const otp = generateOtp();
        req.session.userOtp = otp;
        req.session.otpTimestamp = Date.now()
        console.log("resending otp to email:", email);
        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp);
            res.status(200).json({ success: true, message: "Resend OTP Successful" });
        }
    } catch (error) {
        console.log("Error in resinding otp", error)
        res.status(500).json({ success: false, message: 'internet server  error' })

    }
}

const forgetEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });
        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                req.session.otpTimestamp = Date.now()
                res.render("forgetpass-otp");
                console.log("OTP", otp);
            } else {
                res.json({ success: false, message: "Failed to send OTP.Please try again" });
            }
        } else {
            res.render("forgot-password", {
                message: "User with this email does not exist"

            })
        }

    } catch (error) {

        res.redirect("/pageNotFound");

    }
}

const verifyForgotPassOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const currentTime = Date.now();

        if (!req.session.otpTimestamp || currentTime > req.session.otpTimestamp + OTP_EXPIRATION_TIME) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        if (otp === req.session.userOtp) {
            res.json({
                success: true, redirectUrl: "/reset-password"
            });
        } else {
            console.log("OTP mismatch");
            res.status(400).json({ success: false, message: "Invalid OTP, Please try again" });
        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({ success: false, message: "An error occured.Please try again" });
    }
}

const getResetPassPage = async (req, res) => {
    try {
        res.render("reset-password");

    } catch (error) {
        res.redirect("/pageNotFound");

    }

}


module.exports={
    getForgotPassPage,
    forgetEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    changePass,
    changePasswordValid,
    verifyChangePassOtp,
    
}