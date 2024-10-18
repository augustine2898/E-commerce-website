const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require('../controllers/user/userControllers');
const User = require('../models/userSchema');


router.get("/pageNotFound", userController.pageNotFound);

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
        req.logout(() => { }); // Logs the user out
        res.redirect('/blocked'); // Redirect to a page indicating they are blocked
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


//Home Page & Shopping page
router.get("/", userController.loadHomepage);
router.get("/logout", userController.logout);
module.exports = router;