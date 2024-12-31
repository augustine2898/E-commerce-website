const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require('../controllers/user/userControllers');
const profileController= require("../controllers/user/profileController")
const cartController = require("../controllers/user/cartController")
const checkoutController=require("../controllers/user/checkoutController")
const wishlistController=require("../controllers/user/wishlistController")
const {userAuth,adminAuth}= require("../middlewares/auth")
router.get("/pageNotFound", userController.pageNotFound);
const User = require("../models/userSchema");

//SignUp Managment
router.get("/signup", userController.loadSignup);
router.get("/shop", userController.loadShopping);
router.post("/signup", userController.signUp)
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user && user.isBlocked) {
        req.logout(() => { }); 
        res.redirect('/blocked'); 
    } else {
        req.session.user = req.user._id;
        res.redirect('/');
    }
});

router.get('/blocked', (req, res) => {
    res.render('blocked');
})

router.get("/login", userController.loadLogin);
router.post("/login", userController.login)
router.get("/logout", userController.logout);


//Home Page & Shopping page
router.get("/",userController.loadHomepage);
router.get("/productsview",userController.getAllproducts);
router.get("/productDetails/",userController.loadProductPage);
router.post("/productDetails/review/:id",userController.submitReview);
router.post('/deleteReview/:reviewId', userController.deleteReview);

//Profile Management 
router.get("/forgot-password",profileController.getForgotPassPage);
router.post("/forgot-email-valid",profileController.forgetEmailValid);
router.post("/verify-passForgot-otp",profileController.verifyForgotPassOtp);
router.get("/reset-password",profileController.getResetPassPage);
router.post("/resend-forgot-otp",profileController.resendOtp);
router.post("/reset-password",profileController.postNewPassword);
router.get("/userProfile",profileController.userProfile);
router.get('/addAddress',userAuth,profileController.getAddAddress);
router.post("/addAddress",userAuth,profileController.postaddAddress)
router.get('/editAddress/:id', userAuth, profileController.getEditAddress);
router.post('/editAddress/:id', userAuth, profileController.postEditAddress);
router.delete('/deleteAddress/:id', userAuth, profileController.deleteAddress);
router.get("/change-email",userAuth,profileController.changeEmail);
router.post("/change-email",userAuth,profileController.changeEmailValid);
router.post("/verify-email-otp",userAuth,profileController.verifyEmailOtp);
router.get("/update-email", userAuth, profileController.updateEmailPage);
router.post("/update-email",userAuth,profileController.updateEmail);
router.post("/resend-newemail-otp",userAuth,profileController.resendOtp);
router.get("/change-password",userAuth,profileController.changePass);
router.post("/change-password",userAuth,profileController.changePasswordValid);
router.post("/verify-changepassword-otp",userAuth,profileController.verifyChangePassOtp);
router.get('/edit-profile',userAuth,profileController.getEditProfile);
router.post('/edit-profile', userAuth,profileController.updateProfile);
router.get('/order/:orderId',userAuth,profileController.Orderdetails)
router.post('/cancelOrder/:id',userAuth, profileController.cancelOrder);
router.post('/returnOrder/:id',userAuth, profileController.returnOrder);
router.get('/downloadInvoice/:orderId',userAuth, profileController.downloadInvoice);

//Cart Management 
router.get('/cart',userAuth,cartController.getMyCart)
router.post('/cart/add',userAuth, cartController.addToCart);
router.patch('/cart/remove',userAuth,cartController.removeProductFromCart);
router.post('/cart/update',userAuth,cartController.updateCart)
router.post('/apply-coupon',userAuth,cartController.applyCoupon)
router.post('/remove-coupon', userAuth,cartController.removeCoupon)

//Checkout Mangement 
router.get('/checkout',userAuth,checkoutController.getCheckoutPage);
router.post('/checkout/place-order', checkoutController.placeOrder);
router.get('/editAddresscheckout/:id', userAuth, checkoutController.getEditAddress);
router.post('/editAddresscheckout/:id', userAuth,checkoutController.postEditAddress);
router.post('/verify-payment',userAuth,checkoutController.verifyPayment);
router.post("/checkoutaddAddress",userAuth,checkoutController.postaddAddress)
router.post('/retryPayment/:orderId', checkoutController.retryPayment)
//router.post('/deleteorder',userAuth,checkoutController.deleteorder)

 



//Wishlist Management 

router.get('/wishlist',userAuth,wishlistController.getWishlist)
router.post('/addToWishlist',userAuth,wishlistController.addToWishlist)
router.get('/removeFromWishlist',userAuth,wishlistController.removeProduct)



module.exports = router;