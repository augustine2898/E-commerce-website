const Product = require("../../models/productSchema");
const Category = require("../../models/CategorySchema");
const User = require("../../models/userSchema");

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");



const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        res.render("product-add", {
            cat: category,
        });

    } catch (error) {
        res.redirect("/pageerror");
    }
}

const addProducts = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({ productName: products.productName });

        if (!productExists) {
            const images = [];
            const supportedFormats = ["jpeg", "jpg", "png", "webp"];
            const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'product-image','resized');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;
                    const fileExtension = path.extname(req.files[i].filename).slice(1).toLowerCase();

                    if (!supportedFormats.includes(fileExtension)) {
                        console.error(`Unsupported file format: ${fileExtension}`);
                        return res.status(400).json({error: `Uploaded file contains unsupported format: ${fileExtension}`});
                    }

                    const resizedImagePath = path.join(uploadDir, req.files[i].filename);

                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);
                    
                    images.push(req.files[i].filename);
                }
            }

            const categoryId = await Category.findOne({ name: products.category });
            if (!categoryId) {
                return res.status(400).json("Invalid category name");
            }

            // Determine product status based on quantity
            const status = products.quantity > 0 ? 'Available' : 'Out of Stock';

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                color: products.color,
                productImage: images,
                status: status, // Set status based on quantity
            });

            await newProduct.save();
            return res.json({ success: true, message: "Product added successfully!" });
            
        } else {
            return res.status(400).json({ error: "Product already exists, please try with another name" });
        }

    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect("/admin/pageerror");
    }
};



const getAllproducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1; // Ensure page is an integer
        const limit = 4;

        // Define the search regex with case insensitivity
        const searchRegex = new RegExp(search, 'i');

        // Create a query object to reuse for both fetching and counting
        const query = {
            $or: [
                { productName: searchRegex },
                // Add other fields to search if needed
                // { brand: searchRegex }
            ],
        };

        // Find products based on the query
        const productData = await Product.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('category')
            .exec();

        // Count total documents matching the search criteria
        const count = await Product.countDocuments(query).populate({
            path:'category',
            match:{isListed:true},
        }); 

        const category = await Category.find({ isListed: true });

        if (category) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                search:search
            });
        } else {
            console.error("No categories found.");
            res.render("page404");
        }
    } catch (error) {
        console.error("Error fetching products:", error); // Log the error for debugging
        res.redirect("/admin/pageerror");
    }
};


const addProductOffer = async (req, res) => {
    try {
        const { id, percentage } = req.body;
        console.log(req.body)
        const findProduct = await Product.findOne( {_id: id} );
        console.log(findProduct)
        const findCategory = await Category.findOne({ _id: findProduct.category });
        console.log(findCategory)

        if (findCategory.categoryOffer > percentage) {
            return res.json({ status: false, message: "This product category alreday has a category Offer" })
        }

        if (!findProduct.originalSalePrice) {
            findProduct.originalSalePrice = findProduct.salePrice;
            console.log(findProduct.originalSalePrice);
        }

        
        findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice * (percentage / 100));
        findProduct.productOffer = parseInt(percentage);
        await findProduct.save();
        findCategory.categoryOffer = 0;
        await findCategory.save()
        res.json({ status: true });

    } catch (error) {
        console.error("Error adding product offer:", error);
        // res.redirect("/pageerror");
        res.status(500).json({ status: false, message: "Internal Server Error" });

    }
};

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        const findProduct = await Product.findById(productId);

        if (!findProduct) {
            return res.json({ status: false, message: 'Product not found.' });
        }
        console.log(findProduct.originalSalePrice)
        // Check if originalSalePrice exists
        if (findProduct.originalSalePrice) {
            
            findProduct.salePrice = findProduct.originalSalePrice;
        } else {
            // If no original sale price exists, reset to the regular price
            findProduct.salePrice = findProduct.regularPrice;
        }

        // Remove the offer by setting productOffer to 0
        findProduct.productOffer = 0;

        // Save the updated product
        await findProduct.save();

        res.json({ status: true, message: 'Offer removed successfully.' });
    } catch (error) {
        console.error("Error removing product offer:", error);
        res.json({ status: false, message: 'Error removing offer.' });
    }
};



const blockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        let page = req.query.page || 1;
        console.log(page);
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect(`/admin/products?page=${page}`);
    } catch (error) {
        console.log("product not blocked");
        res.redirect("/pageerror")
    }
}

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        let page =req.query.page || 1;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect(`/admin/products?page=${page}`);
    } catch (error) {
        console.log("product not unblocked");
        res.redirect("/pageerror")
    }
}

const getEditproduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({ _id: id });
        const category = await Category.find({})
        res.render("edit-product", {
            product: product,
            cat: category,
        })
    } catch (error) {
        res.redirect("/pageerror");

    }
}

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const images = [];
        const supportedFormats = ["jpeg", "jpg", "png", "webp"];

        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const originalImagePath = req.files[i].path;
                const fileExtension = path.extname(req.files[i].filename).slice(1).toLowerCase();

                if (!supportedFormats.includes(fileExtension)) {
                    console.error(`Unsupported file format: ${fileExtension}`);
                    return res.status(400).json({ error: `Unsupported file format: ${fileExtension}` });
                }

                const resizedImagePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'product-image', 'resized', req.files[i].filename);

                if (fs.existsSync(originalImagePath)) {
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.descriptionData,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            color: data.color,
            category: data.category,
            productImage: images.length > 0 ? [...product.productImage, ...images] : product.productImage,
            status: data.quantity > 0 ? 'Available' : 'Out of Stock' 
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });
        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "An error occurred while updating the product." });
    }
};





const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } });

        // Define the path where the original and resized images are stored
        const originalImagePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'product-image', imageNameToServer);
        const resizedImagePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'product-image', 'resized', imageNameToServer);

        // Check if the original image exists and delete it
        if (fs.existsSync(originalImagePath)) {
            await fs.unlinkSync(originalImagePath);
            console.log(`Original image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Original image ${imageNameToServer} not found`);
        }

        // Check if the resized image exists and delete it
        if (fs.existsSync(resizedImagePath)) {
            await fs.unlinkSync(resizedImagePath);
            console.log(`Resized image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Resized image ${imageNameToServer} not found`);
        }

        res.send({ status: true});
    } catch (error) {
        console.error("Error deleting image:", error);
        res.redirect("/pageerror");
    }
}

const removeProduct = async (req, res) => {
    const { id } = req.params; // Assuming you're using a route parameter for the category ID

    try {
        // Find the category by ID and remove it
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        return res.json({ message: "Product removed successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getProductAddPage,
    addProducts,
    getAllproducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    getEditproduct,
    editProduct,
    deleteSingleImage,
    removeProduct,
}