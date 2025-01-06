const User = require("../../models/userSchema");///Import user model
//Load Customer Page
const customerinfo = async (req, res) => {
    try {
        const search = req.query.search || ""; 
        const status = req.query.status || ""; 
        const sort = req.query.sort || ""; 
        const order = req.query.order || "asc"; 
        const page = parseInt(req.query.page) || 1; 
        const limit = 3; 

       
        const filter = {
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: "i" } }, 
                { email: { $regex: search, $options: "i" } }
            ]
        };

        
        if (status) {
            if (status === 'active') {
                filter.isBlocked = false; 
            } else if (status === 'blocked') {
                filter.isBlocked = true;
            }
        }

        
        const sortOptions = {};
        if (sort === 'name') {
            sortOptions.name = order === "asc" ? 1 : -1; // Ascending or descending by name
        } else if (sort === 'email') {
            sortOptions.email = order === "asc" ? 1 : -1; // Ascending or descending by email
        }

 
        const userData = await User.find(filter)
            .sort(sortOptions) 
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        
        const count = await User.countDocuments(filter);

        // Render the customers view with the retrieved data and pagination info
        res.render("customers", {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search: search,
            status: status, 
            sort: sort, 
            order: order 
        });
    } catch (error) {//crate erro
        console.error(error); 
        res.redirect("/pageerror");
    }
};
//Blocking customer
const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        let page = req.query.page || 1;

        // Update the user's isBlocked status
        const result = await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        console.log('Block Result:', result);

        // Check if the user is currently logged in and block them
        if (req.user && req.user._id.toString() === id) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                    return res.redirect("/pageerror");
                }
                console.log(`User with ID ${id} has been logged out and blocked.`);
                // After destroying the session, redirect or send a response
                res.clearCookie('connect.sid'); // Clear the session cookie
                return res.redirect(`/admin/users?page=${page}`);
            });
        } else {
            res.redirect(`/admin/users?page=${page}`);
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        res.redirect("/pageerror");
    }
};
//Controller for Unblocking customers
const customerUnblocked = async (req, res) => {
    try {
        let id = req.query.id;
        let page = req.query.page || 1;
        
        // Update the user's isBlocked status
        const result = await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        
        // Log the result of the update
        console.log('Unblock Result:', result);

        res.redirect(`/admin/users?page=${page}`);
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.redirect("/pageerror");
    }
};
// Export the functions to be used in other parts of the application
module.exports = {
    customerinfo,
    customerBlocked,
    customerUnblocked,
}