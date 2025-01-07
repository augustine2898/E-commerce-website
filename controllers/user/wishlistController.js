//const Wishlist = require('../../models/wishlistSchema');
const User =require('../../models/userSchema');
const Product =require('../../models/productSchema');

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        const totalProducts = await Product.countDocuments()
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.find({ _id: { $in: user.wishlist } });

        res.render("wishlist", {
            user,
            currentPage: 'wishlist',
            wishlist: products,
            currentPage: page,
            totalPages: totalPages,  
        });
    } catch (error) {
        console.log(error);
        res.redirect("/pageNotfound");
    }
};


const addToWishlist =async(req,res)=>{
        try{
            const userId =req.session.user;
            const productId =req.body.productId;
            const user =await User.findById(userId);

            if(user.wishlist.includes(productId)){
                return res.status(200).json({status:false,message:'Product already in wishlist'});
            }

            user.wishlist.push(productId);
            await user.save();
            return res.status(200).json({status:true,message:'Product added to wishlist'})

        }catch(error){
            console.log(error);
            return res.status(500).json({status:false,message:"Server error"})

        }
}

const removeProduct =async(req,res)=>{
    try{
        const userId =req.session.user
       
        if (!userId) {
            return res.redirect('/login'); 
        }
        const productId =req.query.productId;
        const user =await User.findById(userId);
        

        const index = user.wishlist.indexOf(productId);
        user.wishlist.splice(index,1);
        await user.save();
        return res.redirect("/wishlist")
        
    }catch(error){
        return res.status(500).json({status:false,message:'Server error'})
    }
}

module.exports ={
    getWishlist,
    addToWishlist,
    removeProduct,
}