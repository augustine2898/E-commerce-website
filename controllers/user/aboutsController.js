const User =require('../../models/userSchema');


const about = async(req,res)=>{
    try{
        const userId = req.session.user;
        const user = await User.findById(userId);

        res.render('about',{user, currentPage: 'about'})
        
    }catch(error){
        console.error("Error loading product page:", error);
        res.status(500).send("An error occurred while loading the product page.");
    }
}

const services = async(req,res)=>{
    try{
        const userId = req.session.user;
        const user = await User.findById(userId);

        res.render('service',{user, currentPage: 'services'})
        
    }catch(error){
        console.error("Error loading product page:", error);
        res.status(500).send("An error occurred while loading the product page.");
    }
}

const contactus = async(req,res)=>{
    try{
        const userId = req.session.user;
        const user = await User.findById(userId);

        res.render('contact',{user, currentPage: 'contact'})
        
    }catch(error){
        console.error("Error loading product page:", error);
        res.status(500).send("An error occurred while loading the product page.");
    }
}

module.exports ={
    about,
    services,
    contactus,
}