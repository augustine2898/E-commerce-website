const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const OTP_EXPIRATION_TIME = 1 * 60 * 1000;
const changeEmail = async (req, res) => {
    try {
        const message = req.session.message || null;
        req.session.message = null; 
        let user = null;
        let userId=req.session.user
        // Check if userId is available and fetch user
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }
        console.log('Current user:', user);
        res.render('change-email', {
            currentPage: 'profile',
            user, 
            message: message 
        });
    } catch (error) {
        console.error('Error rendering change email:', error);
        res.redirect('/pageNotFound');
    }
};

const changeEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("email:",{ email })
        const userExists = await User.findOne({ email });
        if (userExists) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email;
                req.session.otpTimestamp = Date.now();

                let user = null;
                let userId=req.session.user
        // Check if userId is available and fetch user
                if (userId) {
                     user = await User.findById(userId);
                    if (!user) {
                        console.log("no user found when sending email")
                        return res.redirect("/login");
                     }
                }
                res.render("change-email-otp", {
                    currentPage: 'profile',
                    user,
                    message: null // No message needed here, set to null
                });
                console.log("email sent:", email);
                console.log("OTP:", otp);
            } else {
                req.session.message = "Error sending email."; // Set error message in session
                res.redirect('/change-email'); // Redirect to change-email route
            }
        } else {
            req.session.message = "User with this email does not exist"; // Set message for non-existing user
            res.redirect('/change-email'); // Redirect to change-email route
        }
    } catch (error) {
        console.log(error)
        req.session.message = "An error occurred."; // Handle unexpected error
        res.redirect('/change-email'); // Redirect to change-email route
    }
};

const verifyEmailOtp = async (req, res) => {
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
                success: true, redirectUrl: "/update-email"
            });

        } else {
            return res.status(400).json({ success: false, message: "OTP not matching. Please try again." });
        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        return res.status(500).json({ success: false, message: "An error occurred. Please try again." });
    }
};

const updateEmail = async (req, res) => {
    //console.log("Request Body:", req.body); // Log the request body
    try {
        const userId = req.session.user;
        const email  = req.body.email; // Get the email from the request body
        //console.log("New Email:", email); // Check if it's defined

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

         // Assuming you have user ID in the session
        await User.findByIdAndUpdate(userId, { email: email });
        res.status(200).json({ success: true, message: "Email updated successfully" });
    } catch (error) {
        console.error("Error updating email:", error);
        res.status(500).json({ success: false, message: "An error occurred while updating the email." });
    }
};

const updateEmailPage = (req, res) => {
    try {
        // Pass `message` to the EJS template if it exists in the session
        const message = req.session.message || null; // Use null or an empty string as a default if no message exists

        // Render the template with `currentPage`, `user`, and `message`
        res.render("update-email", { 
            currentPage: 'profile',
            user: req.session.user,
            message: message
        });

        // Optionally clear the message after rendering to avoid showing it again
        delete req.session.message;

    } catch (error) {
        console.error("Error loading update-email page:", error);
        res.redirect("/pageNotFound");
    }
};

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

module.exports={
    changeEmail,
    changeEmailValid,
    verifyEmailOtp,
    updateEmail,
    updateEmailPage,
    resendOtp,
    sendVerificationEmail,

}