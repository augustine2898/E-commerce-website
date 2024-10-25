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

        if (!req.files || req.files.length === 0 || req.files.some(file => file.size === 0)) {
            return res.status(400).json({ message: "No valid images uploaded." });
        }
        const products = req.body;

        // Log uploaded files for debugging
        console.log("Uploaded files:", req.files);

        // Check if the product already exists
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (productExists) {
            deleteUploadedImages(images); // Clean up files if there's an error
            return res.status(400).render('product-add', {
                errorMessage: "Product already exists",
                product: products,
                images: images,
                cat: await Category.find({ isListed: true })
            });
        }


        if (!productExists) {
            const images = [];

            // Handle image uploads if files are present
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'product-image', req.files[i].filename);
                    const resizedImagePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'product-image', 'resized', req.files[i].filename); // Define resized image path

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
        deleteUploadedImages(images);

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
        const count = await Product.countDocuments(query); // Reuse the query object

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
        const { productId, percentage } = req.body;
        const findProduct = await Product.findOne({ _id: productId });
        const findCategory = await Category.findOne({ _id: findProduct.category });

        if (findCategory.categoryOffer > percentage) {
            return res.json({ status: false, message: "This product category alreday has a category Offer" })
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
        const { productId } = req.body
        const findProduct = await Product.findOne({ _id: productId });
        const percentage = findProduct.productOffer;
        findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100));
        findProduct.productOffer = 0;
        await findProduct.save();
        res.json({ status: true })
    } catch (error) {
        console.error("Error removing product offer:", error);
        res.redirect("/pageerror")
    }
}

const blockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect("/admin/products");
    } catch (error) {
        console.log("product not blocked");
        res.redirect("/pageerror")
    }
}

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect("/admin/products");
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
        const id = req.params.id; // Get product ID from URL
        const data = req.body; // Get form data
        const product = await Product.findById(id); // Find the existing product

        const images = []; // Array to hold new image filenames

        // Check for new uploaded images
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const originalImagePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'product-image', req.files[i].filename);
                const resizedImagePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'product-image', 'resized', req.files[i].filename);

                if (fs.existsSync(originalImagePath)) {
                    await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                    images.push(req.files[i].filename); // Save the original image filename
                }
            }
        }

        // Prepare the update fields
        const updateFields = {
            productName: data.productName,
            description: data.descriptionData,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            color: data.color,
            category: data.category, // Ensure the category is updated
            productImage: images.length > 0 ? [...product.productImage, ...images] : product.productImage, // Combine existing images with new ones
        };

        console.log("Updated category ID:", updateFields.category);
        // Update the product
        await Product.findByIdAndUpdate(id, updateFields, { new: true });
        res.redirect("/admin/products");
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
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

        res.send({ status: true });
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