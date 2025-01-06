const User =require("../../models/userSchema");//Import user schema 
const mongoose =require("mongoose");//Improting Mongoose for MongoDB
const bcrypt =require("bcrypt"); //Improting bcrypt for hashing 

// Controller to handle rendering of the admin error page
const pageerror =async(req,res)=>{
    
    res.render("admin-error")
}
// Controller to handle rendering of the 404 page
const page404 =async(req,res)=>{
    res.render("pagenotfound");
}
// Function to load the admin login page
const loadLogin =(req,res)=>{
    
    if(req.session.admin){
        
        return res.redirect("/admin/dashboard")
    }
    res.render("admin-login",{message:null})
}
// Function to handle admin login
const login= async(req,res)=>{
    try {
        const {email,password} =req.body;
        const admin =await User.findOne({email,isAdmin:true});
        if(admin){
            const passwordMatch =bcrypt.compare(password,admin.password);
            if (passwordMatch){
                req.session.admin = admin._id;
                return res.redirect("/admin/dashboard");
            }else{
                return res.redirect("/login",{message:"Incorrect Password",email});
            }
        }else{
            return res.redirect("/login");
        }
    } catch (error) {
        console.log("login error",error);
        return res.redirect("/pageerror");
    }
}
// Function to handle admin logout
const logout =async (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("error destroying session",err);
                return res.redirect("/pageerror")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("unexpected error during logout",error);
        res.redirect("/pageerror")
        
    }
}
// Export the functions to be used in other parts of the application
module.exports ={
    loadLogin,
    login,
    pageerror,
    logout,
    page404,
}