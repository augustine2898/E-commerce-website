const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const env = require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === "development"? "http://localhost:3000/auth/google/callback": "https://furni.live/auth/google/callback"  
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log("Google Profile:", profile);  
            let user = await User.findOne({ googleId: profile.id });
            if (user) {
                return done(null, user);  // User exists, log them in
            } else {
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
                user = new User({
                    name: profile.displayName,
                    email: email,
                    googleId: profile.id,
                });
                await user.save();
                return done(null, user);  // New user created
            }
        } catch (error) {
            console.error("Error during Google authentication:", error);
            return done(error, null);  // Corrected error variable
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            console.error("Error finding user during deserialization:", err);
            done(err, null);
        });
});

module.exports = passport;
