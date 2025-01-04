// Import necessary modules
const passport = require('passport');
const User = require('../../models/userSchema'); 

const authController = {
    googleAuth: passport.authenticate('google', { scope: ['profile', 'email'] }),

    googleAuthCallback: async (req, res, next) => {
        passport.authenticate('google', { failureRedirect: '/signup' }, async (err, user) => {
            if (err || !user) {
                return res.redirect('/signup'); 
            }
            try {
                const foundUser = await User.findById(user._id);
                if (foundUser && foundUser.isBlocked) {
                    req.logout(() => {}); 
                    return res.redirect('/blocked');
                }
               
                req.session.user = user._id;
                res.redirect('/');
            } catch (error) {
                console.error('Error during authentication callback:', error);
                res.redirect('/error'); 
            }
        })(req, res, next);
    },

    blockedPage: (req, res) => {
        res.render('blocked');
    }
};

module.exports = authController;
