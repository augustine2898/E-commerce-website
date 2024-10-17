const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt =require("bcrypt");
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
        // Clear the session userData to ensure fields are empty
        req.session.userData = null;

        const message = req.session.message || null; // Retrieve message from session, if available
        req.session.message = null; // Clear the message after displaying it

        // Define the variables to pass to the EJS template
        const { name = '', phone = '', email = '' } = req.session.userData || {};

        return res.render('signup', { name, phone, email, message }); // Pass the variables to the EJS template
    } catch (error) {
        console.log('Sign up page not loading:', error);
        res.status(500).send('Server Error');
    }
};


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

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
                from:process.env.NODEMAILER_EMAIL,
                to:email,
                subject:"Verify your account",
                text:`Your OTP is ${otp}`,
                html:`<b>Your OTP :${otp}</b>`,
            })
            return info.accepted.length > 0
            console.log("email sent")
    } catch (error) {
            console.error("Error sending email",error);
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
            return res.render("signup", renderData); // No need to clear fields here
        }

        // Generate OTP and send email
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json("email-error");
        }
        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };
        res.render("verify-otp");
        console.log("OTP sent", otp);
    } catch (error) {
        console.error("signup error", error);
        res.redirect("/pageNotFound");
    }
};




const securePassword =async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);

        return passwordHash;
    } catch (error) {
        
    }
}

const verifyOtp = async (req,res) => {
    try {
        console.log("entered verfiy otp")
        const { otp } = req.body;
        
        // Add more detailed logging for debugging
        console.log("Entered OTP:", otp); 
        console.log("Session OTP:", req.session.userOtp); 
        console.log("Entered OTP type:", typeof otp); 
        console.log("Session OTP type:", typeof req.session.userOtp);
        console.log(req.session.userData)

        if (otp.toString() === req.session.userOtp.toString()) {

            const user = req.session.userData;
            console.log(req.session.userData)
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

const resendOtp =async(req,res)=>{
    try {
        const {email}=req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }
        const otp =generateOtp();
        req.session.userOtp =otp;
        const emailSent =await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("resend OTP",otp);
            res.status(200).json({success:true,message:"OTP Resend Successfully"})

        }else{
            res.status(500).json({success:false,message:"Failed to resend OTP. Please try  again"});
        }
    } catch (error) {
        console.error("Error resending OTP",error);
        res.status(500).json({success:false,message:"Internal Server Error.Please try again"})
    }
}

const loadShopping = async (req, res) => {
    try {
        return res.render('shop');
    } catch (error) {
        console.log('Shopping page not loading:', error);
        res.status(500).send('Server Error');
    }
}


const loadLogin =async(req,res)=>{
    try {
        if(!req.session.user){
            return res.render("login",{email:''})
        }else{
            res.redirect("/")
        }
    } catch (error) {
        console.error("Error loading login page", error);
        res.redirect("/pageNoFound")
    }
}

const login = async (req,res)=>{
    try {
        const {email,password}=req.body;
        const findUser=await User.findOne({isAdmin:0,email:email});

        if (!findUser){
            return res.render("login",{message:"User not found",email});
        }
        if(findUser.isBlocked){
            return res.render("login",{message:"User is blocked by admin",email})
        }

        const passwordMatch =await bcrypt.compare(password,findUser.password);

        if(!passwordMatch){
            return res.render("login",{message:"Incorrect Password",email})
        }
        req.session.user =findUser._id;
        //req.user =findUser;
        console.log("user logged in",req.session.user)
        res.redirect("/")
    } catch (error) {
        console.error("login error",error);
        res.render("login",{message:"login failed. Please try again later"});
        
    }
}




const loadHomepage = async (req, res) => {
    try {
        //const user = req.user; // This will contain the user's ID
        const userId = req.session.user
        // If user is defined, fetch user data
        let userData = null;
        if (userId) {
            userData = await User.findById(userId); 
            if(!userData){
                console.log("User not found in database for ID:", userId); // Log if user not found
                return res.redirect("/login");
            }
        }

        // Pass userData to home view
        res.render("home", { user: userData });
    } catch (error) {
        console.log('Home page not found',error);
        res.status(500).send('Server error');
    }
}

const logout =async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if (err){
                console.log("session destruction error".err.message);
                return res.redirect("/pageNotFound");
            }
            return res.redirect("/login")
        })
    } catch (error) {
        console.log("logout error",error);
        res.redirect("/pageNotFound");
    }
}

module.exports = {
    loadHomepage,
    pageNotFound,
    loadShopping,
    loadSignup,
    signUp,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,


}