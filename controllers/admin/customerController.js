const User = require("../../models/userSchema");


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
    } catch (error) {
        console.error(error); 
        res.redirect("/pageerror");
    }
};





const customerBlocked= async(req,res)=>{
    try {
        let id = req.query.id;
        let page = req.query.page || 1;
        console.log(req.query.page)
        await User.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect(`/admin/users?page=${page}`);
    } catch (error) {
        res.redirect("/pageerror");
    }
}

const customerUnblocked= async(req,res)=>{
    try {
        let id = req.query.id;
        let page = req.query.page || 1;
        console.log(page)
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect(`/admin/users?page=${page}`);
    } catch (error) {
        res.redirect("/pageerror");
    }
}

module.exports = {
    customerinfo,
    customerBlocked,
    customerUnblocked,
}