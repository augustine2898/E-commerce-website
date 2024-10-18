const User = require("../../models/userSchema");


const customerinfo = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        let page = parseInt(req.query.page) || 1;

        const limit = 3
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*" } },
                { email: { $regex: ".*" + search + ".*" } }
            ]
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec()

        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*" } },
                { email: { $regex: ".*" + search + ".*" } }
            ]
        }).countDocuments();
        res.render("customers",{
            data:userData,
            totalPages:Math.ceil(count/limit),
            currentPage:page,
        })
    } catch (error) {
        res.redirect("/pageerror")
    }
}

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