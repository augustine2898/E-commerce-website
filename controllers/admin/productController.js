const Product = require("../../models/productSchema");
const Category = require("../../models/CategorySchema");
//const Brand = require("../../models/brandSchema");
const User =require("../../models/userSchema");

const fs =require ("fs");
const path =require("path");
const sharp =require("sharp");



const getProductAddPage = async (req,res)=>{
    try{
        const category =await Category.find({isListed:true});
        //const brand =await Brand.find({isBlocked:false});
        res.render("product-add",{
            cat:category,
        });
      
    }catch(error){
        res.redirect("/pageerror");         
    }
}

const addProducts = async (req, res) => {
    try {
        const products = req.body;

        // Log uploaded files for debugging
        console.log("Uploaded files:", req.files);

        // Check if the product already exists
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (!productExists) {
            const images = [];

            // Handle image uploads if files are present
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = path.resolve(__dirname , 'public', 'uploads', 'product-image', req.files[i].filename);
                    const resizedImagePath = path.resolve(__dirname , 'public', 'uploads', 'product-image', 'resized', req.files[i].filename); // Define resized image path

                    // Log the original image path for debugging
                    console.log("Original image path:", originalImagePath);
                    console.log("File size:", req.files[i].size);

                    // Check if the file exists before resizing
                    if (fs.existsSync(originalImagePath)) {
                        await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                        images.push(req.files[i].filename); // Save the original image filename
                    } else {
                        console.error(`File does not exist: ${originalImagePath}`);
                        return res.status(400).json("Uploaded file is missing or not found.");
                    }
                }
            }

            // Validate the category from the database
            const category = await Category.findOne({ name: products.category });
            if (!category) {
                return res.status(400).json("Invalid category name");
            }

            // Create a new product
            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                category: category._id, // Link category ID
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images, // Store uploaded images
                status: 'Available',
            });

            // Save the new product
            await newProduct.save();
            return res.redirect("/admin/addProducts");
        } else {
            return res.status(400).json("Product already exists, please try with another name");
        }
    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect("/admin/pageerror");
    }
};


  

module.exports={
    getProductAddPage,
    addProducts,
}