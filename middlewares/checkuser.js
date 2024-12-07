const checkUserStatus = (req, res, next) => {
    if (req.user && req.user.isBlocked) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.redirect("/pageNotFound"); // Redirect to an error or page-not-found route
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.redirect("/blocked"); // Redirect to a custom blocked page
        });
    } else {
        next(); // Allow the request to continue if the user is not blocked
    }
};
