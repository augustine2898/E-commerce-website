//const Wishlist = require('../../models/wishlistSchema');
const User =require('../../models/userSchema');
const Product =require('../../models/productSchema');

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        

        const products = await Product.find({ _id: { $in: user.wishlist } });

        res.render("wishlist", {
            user,
            currentPage: 'wishlist',
            wishlist: products,  
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
        console.log('User ID:', userId);
       
        if (!userId) {
            return res.redirect('/login'); 
        }
        const productId =req.query.productId;
        console.log('Product ID:', productId)
        const user =await User.findById(userId);
        console.log(user)

        const index = user.wishlist.indexOf(productId);
        console.log('index',index)
        user.wishlist.splice(index,1);
        await user.save();
        console.log('Updated Wishlist:', user.wishlist)
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