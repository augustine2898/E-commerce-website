const User =require("../models/userSchema");

const userAuth = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user); // Ensure correct property (user ID) is checked

            if (user) {
                if (user.isBlocked) {
                   
                    req.session.destroy((err) => {
                        if (err) {
                            console.error('Session destroy error:', err);
                            return res.redirect("/pageNotFound"); // Redirect to an error or page-not-found route
                        }
                        res.clearCookie('connect.sid'); // Clear the session cookie
                        res.redirect("/blocked"); // Redirect to a custom blocked page
                    });
                } else {
                    // User is authenticated and not blocked, proceed to the route
                    next();
                }
            } else {
                // User not found, redirect to login
                res.redirect("/login");
            }
        } else {
            // No user in session, redirect to login
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error in user auth middleware:", error);
        res.status(500).send("Internal server error");
    }
};


const adminAuth =(req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.log("Error in adminauth middleware",error);
        res.status(500).send("internal Server Error");
    })
}

module.exports ={
    userAuth,
    adminAuth,
}