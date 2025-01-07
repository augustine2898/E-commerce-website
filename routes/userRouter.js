const express = require("express");
const router = express.Router();
const userController = require('../controllers/user/userControllers');
const profileController= require("../controllers/user/profileController");
const cartController = require("../controllers/user/cartController");
const checkoutController=require("../controllers/user/checkoutController");
const wishlistController=require("../controllers/user/wishlistController");
const addressController =require("../controllers/user/addressController");
const orderController =require("../controllers/user/orderController");
const emailController =require("../controllers/user/emailController");
const PasswordController=require("../controllers/user/passwordController");
const reviewController =require("../controllers/user/reviewController");
const authController =require("../controllers/user/passportController");
const shopController =require("../controllers/user/shopController");
const aboutController =require("../controllers/user/aboutsController")
const {userAuth,adminAuth}= require("../middlewares/auth");

//Error Management
router.get("/pageNotFound", userController.pageNotFound);

//SignUp Managment
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signUp)
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.get("/login", userController.loadLogin);
router.post("/login", userController.login)
router.get("/logout", userController.logout);

//SSI Managment
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleAuthCallback);
router.get('/blocked', authController.blockedPage);


//
router.get('/about',aboutController.about);
router.get('/service',aboutController.services)
router.get('/contact',aboutController.contactus)

//Home Page & Shopping page
router.get("/",shopController.loadHomepage);
router.get("/productsview",shopController.getAllproducts);
router.get("/productDetails/",shopController.loadProductPage);
router.get("/shop", shopController.loadShopping);
//Review Controller
router.post("/productDetails/review/:id",reviewController.submitReview);
router.post('/deleteReview/:reviewId', reviewController.deleteReview);

//Password Management 
router.get("/forgot-password",PasswordController.getForgotPassPage);
router.post("/forgot-email-valid",PasswordController.forgetEmailValid);
router.post("/verify-passForgot-otp",PasswordController.verifyForgotPassOtp);
router.get("/reset-password",PasswordController.getResetPassPage);
router.post("/resend-forgot-otp",PasswordController.resendOtp);
router.post("/reset-password",PasswordController.postNewPassword);
router.post("/resend-newemail-otp",userAuth,PasswordController.resendOtp);
router.get("/change-password",userAuth,PasswordController.changePass);
router.post("/change-password",userAuth,PasswordController.changePasswordValid);
router.post("/verify-changepassword-otp",userAuth,PasswordController.verifyChangePassOtp);
//Profile Management 
router.get("/userProfile",profileController.userProfile);
router.get('/edit-profile',userAuth,profileController.getEditProfile);
router.post('/edit-profile', userAuth,profileController.updateProfile);
//Email Management 
router.get("/change-email",userAuth,emailController.changeEmail);
router.post("/change-email",userAuth,emailController.changeEmailValid);
router.post("/verify-email-otp",userAuth,emailController.verifyEmailOtp);
router.get("/update-email", userAuth, emailController.updateEmailPage);
router.post("/update-email",userAuth,emailController.updateEmail);

//Order Management
router.get('/order/:orderId',userAuth,orderController.Orderdetails);
router.post('/cancelOrder/:id',userAuth, orderController.cancelOrder);
router.post('/returnOrder/:id',userAuth, orderController.returnOrder);
router.get('/downloadInvoice/:orderId',userAuth, orderController.downloadInvoice);

//Address Management
router.get('/addAddress',userAuth,addressController.getAddAddress);
router.post("/addAddress",userAuth,addressController.postaddAddress)
router.get('/editAddress/:id', userAuth, addressController.getEditAddress);
router.post('/editAddress/:id', userAuth, addressController.postEditAddress);
router.delete('/deleteAddress/:id', userAuth, addressController.deleteAddress);

//Cart Management 
router.get('/cart',userAuth,cartController.getMyCart);
router.post('/cart/add',userAuth, cartController.addToCart);
router.patch('/cart/remove',userAuth,cartController.removeProductFromCart);
router.post('/cart/update',userAuth,cartController.updateCart);
router.post('/apply-coupon',userAuth,cartController.applyCoupon);
router.post('/remove-coupon', userAuth,cartController.removeCoupon);

//Checkout Mangement 
router.get('/checkout',userAuth,checkoutController.getCheckoutPage);
router.post('/checkout/place-order', checkoutController.placeOrder);
router.get('/editAddresscheckout/:id', userAuth, checkoutController.getEditAddress);
router.post('/editAddresscheckout/:id', userAuth,checkoutController.postEditAddress);
router.post('/verify-payment',userAuth,checkoutController.verifyPayment);
router.post("/checkoutaddAddress",userAuth,checkoutController.postaddAddress);
router.post('/retryPayment/:orderId',userAuth, checkoutController.retryPayment);
router.post('/restore-stock',userAuth,checkoutController.restoreStock);
 
//Wishlist Management 
router.get('/wishlist',userAuth,wishlistController.getWishlist);
router.post('/addToWishlist',userAuth,wishlistController.addToWishlist);
router.get('/removeFromWishlist',userAuth,wishlistController.removeProduct);


module.exports = router;