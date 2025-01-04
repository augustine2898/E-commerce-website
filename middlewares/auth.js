const User =require("../models/userSchema");

const userAuth = async (req, res, next) => {
    try {
        console.log(req.session.user)
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


// const adminAuth =(req,res,next)=>{
//     User.findOne({isAdmin:true})
//     .then(data=>{
//         if(data){
//             next();
//         }else{
//             res.redirect("/admin/login")
//         }
//     })
//     .catch(error=>{
//         console.log("Error in adminauth middleware",error);
//         res.status(500).send("internal Server Error");
//     })
// }


const adminAuth = async (req, res, next) => {
    try {
        const userSession = req.session.admin;
        console.log(userSession)
        // If there's no session, redirect to admin login page
        if (!userSession) {
            return res.redirect("/admin/login");
        }

        // Find user from the database using session user ID
        const user = await User.findOne({_id:userSession});

        if (user) {
            // Check if the user is an admin
            if (user.isAdmin) {
                
                return next();
            } else {
                // If the user is not an admin, redirect to admin login page
                return res.redirect("/admin/login");
            }
        } else {
            // If the user is not found, redirect to admin login page
            return res.redirect("/admin/login");
        }
    } catch (error) {
        console.error("Error in admin auth middleware:", error);
        return res.status(500).send("Internal server error");
    }
};

module.exports ={
    userAuth,
    adminAuth,
}