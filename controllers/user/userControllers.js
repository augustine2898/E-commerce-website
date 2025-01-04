const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();

const pageNotFound = async (req, res) => {
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const loadSignup = async (req, res) => {

    try {
       
        req.session.userData = null;

        const message = req.session.message || null; 
        req.session.message = null; 

        
        const { name = '', phone = '', email = '' } = req.session.userData || {};

        return res.render('signup', { name, phone, email, message }); 
    } catch (error) {
        console.log('Sign up page not loading:', error);
        res.status(500).send('Server Error');
    }
};

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({

            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP :${otp}</b>`,
        })
        return info.accepted.length > 0
        console.log("email sent")
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

const signUp = async (req, res) => {
    try {
        const { name, phone, email, password, confirm_password } = req.body;

        // Initialize an object to hold the data to render the signup page
        const renderData = { name, phone, email, message: null };

        // Password validation checks
        if (!/[A-Z]/.test(password)) {
            renderData.message = 'Password must contain at least one uppercase letter.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (!/[a-z]/.test(password)) {
            renderData.message = 'Password must contain at least one lowercase letter.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (!/\d/.test(password)) {
            renderData.message = 'Password must contain at least one number.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (!/[@$!%*?&]/.test(password)) {
            renderData.message = 'Password must contain at least one special character (@$!%*?&).';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (password.length < 8) {
            renderData.message = 'Password must be at least 8 characters long.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (password !== confirm_password) {
            renderData.message = 'Passwords do not match.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }

        // Check if the user already exists
        const findUser = await User.findOne({ email });
        if (findUser) {
            renderData.message = "User with this email already exists.";
            return res.render("signup", renderData); 
        }

        // Generate OTP and send email
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json("email-error");
        }
        req.session.userOtp = otp;
        req.session.otpTimestamp = Date.now();
        req.session.userData = { name, phone, email, password };
        res.render("verify-otp");
        console.log("OTP sent", otp);
    } catch (error) {
        console.error("signup error", error);
        res.redirect("/pageNotFound");
    }
};

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);

        return passwordHash;
    } catch (error) {

    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const OTP_EXPIRATION_TIME = 1 * 60 * 1000; // 1 minutes in milliseconds

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const currentTime = Date.now();
        
        // Check if OTP is expired
        if (!req.session.otpTimestamp || currentTime > req.session.otpTimestamp + OTP_EXPIRATION_TIME) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }
        console.log("Session OTP Timestamp:", req.session.otpTimestamp);
        // Validate OTP
        if (otp.toString() === req.session.userOtp.toString()) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });

            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: "/" });
        } else {
            console.log("OTP mismatch");
            res.status(400).json({ success: false, message: "Invalid OTP, Please try again" });
        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }
        const otp = generateOtp();
        req.session.userOtp = otp;
        req.session.otpTimestamp = Date.now(); // Update timestamp with each resend
        const emailSent = await sendVerificationEmail(email, otp);
        
        if (emailSent) {
            console.log("resend OTP", otp);
            res.status(200).json({ success: true, message: "OTP Resent Successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP. Please try again" });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        res.status(500).json({ success: false, message: "Internal Server Error. Please try again" });
    }
};

const loadLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("login", { email: '' })
        } else {
            res.redirect("/")
        }
    } catch (error) {
        console.error("Error loading login page", error);
        res.redirect("/pageNoFound")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ isAdmin: 0, email: email });

        if (!findUser) {
            return res.render("login", { message: "User not found", email });
        }

        if (findUser.isGoogleUser) {
            return res.render("login", { message: "User already exists. Please sign in using Google.", email });
        }

        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin", email });
        }

        if (!findUser.password) {
            console.error("No password found for user:", findUser.email);
            return res.render("login", { message: "Login failed. This account is associated with Google sign-in. Please sign in using Google.", email });
        }

        // Password comparison
        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect Password", email });
        }

        req.session.user = findUser._id; 
        res.redirect("/"); 
    } catch (error) {
        console.error("Login error:", error.message); // Log specific error details for debugging
        res.render("login", { message: "Login failed. Please try again later.", email: req.body.email });
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("session destruction error".err.message);
                return res.redirect("/pageNotFound");
            }
            return res.redirect("/login")
        })
    } catch (error) {
        console.log("logout error", error);
        res.redirect("/pageNotFound");
    }
}

module.exports = {   
    pageNotFound,
    loadSignup,
    signUp,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,   
}