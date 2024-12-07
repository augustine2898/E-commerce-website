const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Order =require("../../models/orderSchema")
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const mongoose = require("mongoose");

const getForgotPassPage = async (req, res) => {
    try {
        res.render("forgot-password", { message: null })
    } catch (error) {


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




const userProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login'); // Redirect if no user session
        }

        const userData = await User.findById(userId);
        const addresses = await Address.find({ userId });
        
        // Fetch the orders associated with the user
        const orders = await Order.find({user:userData._id });
        //console.log(orders)

        res.render('profile', {
            user: userData,
            addresses,
            orders, // Pass orders to the template
            currentPage: 'profile'
        });
    } catch (error) {
        console.error("Error retrieving profile data:", error);
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

const changeEmail = async (req, res) => {
    try {
        const message = req.session.message || null;
        req.session.message = null; // Clear message after it's used

        // Check if user is defined
        

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
            user, // Pass user to the view
            message: message // Pass message to the view
        });
    } catch (error) {
        console.error('Error rendering change email:', error);
        res.redirect('/pageNotFound');
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

        // Log user ID and data being updated
       // console.log("Updating user:", userId, { name, phone });

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






const changeEmailValid = async (req, res) => {
    try {
        const { email } = req.body;

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

const getAddAddress = async (req, res) => {
    try {
        let user = null;
        let userId=req.session.user
        // Check if userId is available and fetch user
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }

        res.render('add-Address', {
            currentPage: 'profile',
            user,
        });
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}

const postaddAddress = async (req, res) => {
    try {
        // Destructure the address data from the request body
        const { firstName, lastName, landmark, addressDetail, state, zip, phone, altPhone } = req.body;

        // Validate required fields (add more validation as needed)
        if (!firstName || !lastName || !landmark || !addressDetail || !state || !zip || !phone) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Create a new address document
        const newAddress = new Address({
            userId: req.session.user, 
            address: [{
                addressType: 'home', 
                name: `${firstName} ${lastName}`, 
                city: landmark, 
                landMark: landmark,
                addressDetail, 
                state,
                pincode: zip,
                phone,
                altPhone: altPhone || '',
            }]
        });

        
        await newAddress.save();

        
        res.status(201).json({
            message: 'Address added successfully.',
            address: newAddress
        });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Server error while adding address.' });
    }
};





const getEditAddress = async (req, res) => {
    const addressId = req.params.id; 
  
    try {
      const address = await Address.findById(addressId); 
      if (!address) {
        return res.status(404).send({ message: 'Address not found.' });
      }
  
      let user = null;
        let userId=req.session.user
        // Check if userId is available and fetch user
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }
      res.render('edit-address', { address,
            currentPage: 'profile',
            user,
       });
    } catch (error) {
      res.status(500).send({ message: 'Error retrieving address details.' });
    }
  };


  const postEditAddress = async (req, res) => {
    const addressId = req.params.id; 
    const {
        firstName,
        lastName,
        landmark,
        addressDetail,
        state,
        zip,
        phone,
        altPhone,
    } = req.body; // Destructure the data from the request body

    try {
        // Find the address by ID
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).send({ message: 'Address not found.' });
        }

        // Update the address fields
        const fullName = `${firstName} ${lastName}`;
        address.address[0].name = fullName;
        address.address[0].landMark = landmark;
        address.address[0].addressDetail = addressDetail;
        address.address[0].state = state;
        address.address[0].pincode = zip;
        address.address[0].phone = phone;
        address.address[0].altPhone = altPhone;

        // Save the updated address
        await address.save();

        // Respond with success message
        return res.status(200).send({ message: 'Address updated successfully!' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ message: 'Error updating address.' });
    }
};

const deleteAddress = async (req, res) => {
    const addressId = req.params.id; 

    try {
        
        const result = await Address.findByIdAndDelete(addressId);
        if (!result) {
            return res.status(404).send({ message: 'Address not found.' });
        }

      
        return res.status(200).send({ message: 'Address deleted successfully!' });
    } catch (error) {
        console.error(error); 
        return res.status(500).send({ message: 'Error deleting address.' });
    }
};



const Orderdetails = async (req, res) => {
  try {
    
    const orderId = req.params.orderId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        console.error('Invalid orderId:', orderId);
        return res.status(400).send('Invalid Order ID');
      }

    console.log(orderId);
    const order = await Order.findById(orderId)
      .populate('orderItems.product') 
      .populate('user')               
      .populate('address')            
      .exec();

    console.log('Order:', order); 

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const userId = req.session.user; 
    if (!userId) {
      return res.redirect('/login'); // Redirect if no user session
    }

   
     const userData = await User.findById(userId);

    
    res.render('orderdetailpage', { 
      order, 
      user:userData, 
      currentPage: 'profile' 
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).send('Internal Server Error');
  }
};

  








 const  cancelOrder = async (req, res) => {
    const orderId = req.params.id;
  
    try {
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }
  
      // Check if the order is in a status that allows cancellation
      if (order.status !== 'Pending' && order.status !== 'Processing') {
        return res.status(400).json({ message: 'Order cannot be canceled at this stage.' });
      }
  
      // Update order status to "Canceled"
      order.status = 'Canceled';
      await order.save();
  
      res.status(200).json({ message: 'Order has been canceled successfully.' });
    } catch (error) {
      console.error('Error canceling order:', error);
      res.status(500).json({ message: 'An error occurred while canceling the order.' });
    }
  };













module.exports = {
    getEditProfile,
    updateProfile,
    getForgotPassPage,
    forgetEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    userProfile,
    changeEmail,
    changeEmailValid,
    verifyEmailOtp,
    updateEmail,
    updateEmailPage,
    changePass,
    changePasswordValid,
    verifyChangePassOtp,
    getAddAddress,
    postaddAddress,
    getEditAddress,
    postEditAddress,
    deleteAddress,
    Orderdetails,
    cancelOrder,
}