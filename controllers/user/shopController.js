const User = require("../../models/userSchema");
const Category = require("../../models/CategorySchema");
const Product = require("../../models/productSchema");
const Review = require("../../models/ReviewSchema");
const { getAllproducts } = require("../admin/productController");

const loadProductPage = async (req, res) => {
    try {
        const { id } = req.query; 
        const userId = req.session.user;
        // Fetch the product
        const product = await Product.findOne({ 
            _id: id,
            isBlocked: false 
        }).populate({
            path: 'category',
            match: { isListed: true } // Ensures the category is listed
        });

        if (!product || !product.category) {
            return res.status(404).send("Product not found or category not listed.");
        }
        // Set availability and status based on quantity
        product.isUnavailable = product.quantity <= 0;
        product.status = product.quantity === 0 ? 'Out of Stock' : 'Available';
        // Fetch related products from the same category
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id },
            isBlocked: false
        }).limit(4);
        // Fetch reviews
        const reviews = await Review.find({ product: product._id })
            .populate('user', 'name') 
            .sort({ createdAt: -1 });

        // Calculating average rating
        const averageRating = reviews.length
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
            : 0;
        // Fetch categories (if needed)
        const categories = await Category.find({ isListed: true });
        const productDescription = product.description;
        let user = null;
        // Check if userId is available and fetch user
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }
        let wishlistProductIds = [];
        if (user) {
            wishlistProductIds = user.wishlist; 
        }
        res.render('productdetail', {
            product,
            productDescription,
            averageRating,
            reviews, 
            relatedProducts,
            user,
            currentPage: 'shop',
            cat: categories,
            wishlistProductIds,
            breadcrumbs: [
                { label: 'Home', url: '/' },
                { label: product.category.name, url: `/category/${product.category._id}` },
                { label: product.name, url: `/product/${product._id}` }
            ],
        });

    } catch (error) {
        console.error("Error loading product page:", error);
        res.status(500).send("An error occurred while loading the product page.");
    }
};

const loadShopping = async (req, res) => {
    try {
        // Extract query parameters
        const { sort, priceMin, priceMax, category, status, search } = req.query;
        // Initialize the query object for filtering
        let query = { isBlocked: false };
        // Price range filter
        if (priceMin && priceMax) {
            query.salePrice = { $gte: parseFloat(priceMin), $lte: parseFloat(priceMax) };
        }
        // Category filter
        if (category) {
            query.category = category;
        }
        if (search) {
            query.productName = { $regex: new RegExp(search, 'i') };
        }
        // Status filter (Available or Out of Stock)
        if (status === 'Available') {
            query.quantity = { $gt: 0 };
        } else if (status === 'Out of Stock') {
            query.quantity = 0;
        }

        const sortOptions = {
            aToZ: { productName: 1 },
            zToA: { productName: -1 },
            priceAsc: { salePrice: 1 },
            priceDesc: { salePrice: -1 },
            newArrivals: { createdAt: -1 }
        };

        const sortQuery = sortOptions[sort] || sortOptions.newArrivals;
        const products = await Product.find(query)
            .sort(sortQuery)
            .collation({ locale: 'en', strength: 1 }) // Case-insensitive sorting
            .populate({ path: 'category', match: { isListed: true } });
        const categories = await Category.find({ isListed: true });
        const userId = req.session.user;
        const user = userId ? await User.findById(userId) : null;
        let wishlistProductIds = [];
        if (user) {
            wishlistProductIds = user.wishlist;  
        }
        const totalProducts = await Product.countDocuments(query)
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalProducts / limit);
        
        return res.render('shop', {
            products,                      
            user,                         
            currentPage: 'shop',           
            cat: categories,               
            category: category || '',      
            sort: sort || 'default',       
            priceMin: priceMin || '',      
            priceMax: priceMax || '',      
            status: status || '',         
            searchQuery: search || '',   
            wishlistProductIds,
            currentPage: page,
            totalPages: totalPages,
        });

    } catch (error) {
        console.error('Error loading shopping page:', error);
        res.status(500).send('Server Error');
    }
};



const loadHomepage = async (req, res) => {
    try {
        const userId = req.session.user;
        const categories = await Category.find({ isListed: true });
        
        // Adjust the query to include products with zero quantity as well.
        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
        });

        // You need to define 'status' before using it
        const status = req.query.status || ''; // Retrieve status from query params or set default as empty string
        
        if (status === 'Available') {
            productData = productData.filter(product => product.quantity > 0); // Filter available products
        } else if (status === 'Out of Stock') {
            productData = productData.filter(product => product.quantity === 0); // Filter out-of-stock products
        }

        // Sort products by creation date
        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

        // Limit the product list to 4 items
        productData = productData.slice(0, 4);

        let user = null;
        if (userId) {
            user = await User.findById(userId); 
            if (!user) {
                console.log("User not found in database for ID:", userId);
                return res.redirect("/login"); 
            }
        }

        let wishlistProductIds = [];
        if (user) {
            wishlistProductIds = user.wishlist;  
        }

        // Render the homepage with the user, products, and status information
        return res.render("home", {
            user: user,
            products: productData,
            currentPage: 'home',
            wishlistProductIds,
            status: status, // Pass the status variable to the view
        });
    } catch (error) {
        console.log('Home page not found', error);
        res.status(500).send('Server error');
    }
}


module.exports={
    loadProductPage,
    loadShopping,
    getAllproducts,
    loadHomepage,
}