const Category = require("../../models/CategorySchema");
const Product = require("../../models/productSchema");




const categoryInfo = async (req, res) => {
    try {
        const search = req.query.search || ""; 
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        
        const categoryData = await Category.find({
            $or: [
                { name: { $regex: new RegExp(search, "i") } },
                { description: { $regex: new RegExp(search, "i") } },
            ],
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments({
            $or: [
                { name: { $regex: new RegExp(search, "i") } },
                { description: { $regex: new RegExp(search, "i") } },
            ],
        });

        const totalPages = Math.ceil(totalCategories / limit);

        res.render("category", {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            search: search, // Pass the search term to the EJS template
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};





const removeCategory = async (req, res) => {
    const { id } = req.params; // Assuming you're using a route parameter for the category ID

    try {
        // Find the category by ID and remove it
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.json({ message: "Category removed successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

const addCategoryOffer = async (req, res) => {

    try {
        const percentage = parseInt(req.body.percentage);
        const categoryId = req.body.categoryId;
        // Validates the percentage
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            return res.status(400).json({ status: false, message: "Percentage must be a number between 0 and 100." });
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" })
        }
        const products = await Product.find({ category: category._id });
        const hasProductOffer = products.some((product) => product.productoffer > percentage);
        if (hasProductOffer) {
            return res.json({
                status: false, message: "The Product within this category already have product offer"
            })
        }
        await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

        for (const product of products) {
            product.productOffer = percentage;
            const discountAmount = (product.regularPrice * percentage) / 100;
            product.salePrice = product.regularPrice - discountAmount
            await product.save();
        }
        res.json({ status: true });

    } catch (error) {
        console.error("Error adding category offer:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
}

const removeCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" })
        }
        const percentage = category.categoryOffer;
        const products = await Product.find({ category: category._id });

        if (products.length > 0) {
            for (const product of products) {
                product.salePrice += Math.floor(product.regularPrice * (percentage / 100))
                product.productOffer = 0;
                await product.save();
            }
        }
        category.categoryOffer = 0;
        await category.save();
        res.json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, message: "Internal Server Error" })
    }
}

const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        res.json({ success: true, message: "Category listed successfully" });
    } catch (error) {
        console.error("Error listing category:", error);
        res.status(500).json({ success: false, message: "Error listing category" });
    }
};

const getUnlistCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.json({ success: true, message: "Category unlisted successfully" });
    } catch (error) {
        console.error("Error unlisting category:", error);
        res.status(500).json({ success: false, message: "Error unlisting category" });
    }
};



const getEditCategory =async(req,res)=>{
    try {
        const id =req.query.id;
        const category =await Category.findOne({_id:id});
        res.render("edit-category",{category:category});
    } catch (error) {
        res.redirect("/pageerror");
    }
   
}

const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            return res.status(409).json({ error: "Category already exisits" })
        }
        const newCategory = new Category({
            name,
            description,
        })
        await newCategory.save()
        return res.json({ message: "category added successfully" })
    }
    catch (error) {
        return res.status(500).json({ error: "Internet server error" })
    }
}

const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description } = req.body;

        // Basic validation
        if (!name || !description) {
            return res.status(400).json({ success: false, error: "Name and description are required." });
        }

        // Check for existing category but ignore the current one
        const existingCategory = await Category.findOne({
            _id: { $ne: id }, // Exclude the current category
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).json({ success: false, error: "Category exists, please choose another name." });
        }

        // Update category
        const updatedCategory = await Category.findByIdAndUpdate(id, {
            name: name,
            description: description,
        }, { new: true });

        if (updatedCategory) {
            return res.json({ success: true, message: "Category updated successfully." });
        } else {
            return res.status(404).json({ success: false, error: "Category not found." });
        }
    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ success: false, error: "Internal server error." });
    }
};





module.exports = {
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnlistCategory,
    removeCategory,
    getEditCategory,
    editCategory,
}