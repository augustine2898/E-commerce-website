const User =require("../../models/userSchema");
const mongoose =require("mongoose");
const bcrypt =require("bcrypt");

const pageerror =async(req,res)=>{
    
    res.render("admin-error")
}

const page404 =async(req,res)=>{
    res.render("pagenotfound");
}

const loadLogin =(req,res)=>{
    
    if(req.session.admin){
        
        return res.redirect("/admin/dashboard")
    }
    res.render("admin-login",{message:null})
}

const login= async(req,res)=>{
    try {
        const {email,password} =req.body;
        const admin =await User.findOne({email,isAdmin:true});
        if(admin){
            const passwordMatch =bcrypt.compare(password,admin.password);
            if (passwordMatch){
                req.session.admin = true;
                return res.redirect("/admin");
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

const loadDashboard=async(req,res)=>{
if(req.session.admin){
    try {
        res.render("dashboard");
    } catch (error) {
        res.redirect("/pageerror");
    }
}
}

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

module.exports ={
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
    page404,
}