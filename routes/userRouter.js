const express = require("express");
const router = express.Router();
const passport =require("passport");
const userController = require('../controllers/user/userControllers');


router.get("/pageNotFound", userController.pageNotFound);

//SignUp Managment
router.get("/signup",userController.loadSignup);
router.get("/shop",userController.loadShopping);
router.post("/signup",userController.signUp)
router.post("/verify-otp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
})

router.get("/login",userController.loadLogin);
router.post("/login",userController.login)


//Home Page & Shopping page
router.get("/", userController.loadHomepage);
router.get("/logout",userController.logout);
module.exports = router;