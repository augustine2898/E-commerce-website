const User = require("../../models/userSchema");
const Category = require("../../models/CategorySchema");
const Product = require("../../models/productSchema");
const Review = require("../../models/ReviewSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { getAllproducts } = require("../admin/productController");
const env = require("dotenv").config();


const pageNotFound = async (req, res) => {
    try {
        res.render("page-404")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


const loadSignup = async (req, res) => {

    try {
       
        req.session.userData = null;

        const message = req.session.message || null; 
        req.session.message = null; 

        
        const { name = '', phone = '', email = '' } = req.session.userData || {};

        return res.render('signup', { name, phone, email, message }); 
    } catch (error) {
        console.log('Sign up page not loading:', error);
        res.status(500).send('Server Error');
    }
};




async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({

            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP :${otp}</b>`,
        })
        return info.accepted.length > 0
        console.log("email sent")
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

 const signUp = async (req, res) => {
    try {
        const { name, phone, email, password, confirm_password } = req.body;

        // Initialize an object to hold the data to render the signup page
        const renderData = { name, phone, email, message: null };

        // Password validation checks
        if (!/[A-Z]/.test(password)) {
            renderData.message = 'Password must contain at least one uppercase letter.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (!/[a-z]/.test(password)) {
            renderData.message = 'Password must contain at least one lowercase letter.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (!/\d/.test(password)) {
            renderData.message = 'Password must contain at least one number.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (!/[@$!%*?&]/.test(password)) {
            renderData.message = 'Password must contain at least one special character (@$!%*?&).';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (password.length < 8) {
            renderData.message = 'Password must be at least 8 characters long.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }
        if (password !== confirm_password) {
            renderData.message = 'Passwords do not match.';
            return res.render("signup", { ...renderData, password }); // Keep password input intact
        }

        // Check if the user already exists
        const findUser = await User.findOne({ email });
        if (findUser) {
            renderData.message = "User with this email already exists.";
            return res.render("signup", renderData); 
        }

        // Generate OTP and send email
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json("email-error");
        }
        req.session.userOtp = otp;
        req.session.otpTimestamp = Date.now();
        req.session.userData = { name, phone, email, password };
        res.render("verify-otp");
        console.log("OTP sent", otp);
    } catch (error) {
        console.error("signup error", error);
        res.redirect("/pageNotFound");
    }
};




const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);

        return passwordHash;
    } catch (error) {

    }
}


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const OTP_EXPIRATION_TIME = 1 * 60 * 1000; // 1 minutes in milliseconds

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const currentTime = Date.now();
        
        // Check if OTP is expired
        if (!req.session.otpTimestamp || currentTime > req.session.otpTimestamp + OTP_EXPIRATION_TIME) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }
        console.log("Session OTP Timestamp:", req.session.otpTimestamp);
        // Validate OTP
        if (otp.toString() === req.session.userOtp.toString()) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });

            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: "/" });
        } else {
            console.log("OTP mismatch");
            res.status(400).json({ success: false, message: "Invalid OTP, Please try again" });
        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
};


const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }
        const otp = generateOtp();
        req.session.userOtp = otp;
        req.session.otpTimestamp = Date.now(); // Update timestamp with each resend
        const emailSent = await sendVerificationEmail(email, otp);
        
        if (emailSent) {
            console.log("resend OTP", otp);
            res.status(200).json({ success: true, message: "OTP Resent Successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP. Please try again" });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        res.status(500).json({ success: false, message: "Internal Server Error. Please try again" });
    }
};






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

        res.render('productdetail', {
            product,
            productDescription,
            averageRating,
            reviews, 
            relatedProducts,
            user,
            currentPage: 'shop',
            cat: categories,
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






const submitReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.session.user; 
        const productId = req.params.id; 

        if (!userId) {
            return res.status(403).send("You must be logged in to submit a review.");
        }

        
        const newReview = new Review({
            product: productId,
            user: userId,
            rating: Number(rating),
            comment,
        });

       
        const savedReview = await newReview.save();

        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found.");
        }

                                                 
        product.reviews.push(savedReview._id);// Push the new review's ID into the product's reviews array
        await product.save();

        res.redirect(`/productDetails?id=${productId}`);
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).send("An error occurred while submitting the review.");
    }
};


const deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.session.user;

        const review = await Review.findById(reviewId);

        // Check if the user is the author of the review
        if (review.user.toString() !== userId) {
            return res.status(403).json({ error: "You are not authorized to delete this review." });
        }

        await Review.findByIdAndDelete(reviewId);

        // Redirect to the product page
        const productId = review.product; // Assuming the review schema includes a reference to the product
        res.redirect(`/productDetails?id=${productId}`);
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ error: "An error occurred while deleting the review." });
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

        // Search filter
        if (search) {
            query.productName = { $regex: new RegExp(search, 'i') };
        }

        // Status filter (Available or Out of Stock)
        if (status === 'Available') {
            query.quantity = { $gt: 0 };
        } else if (status === 'Out of Stock') {
            query.quantity = 0;
        }

        // Sorting options
        const sortOptions = {
            aToZ: { productName: 1 },
            zToA: { productName: -1 },
            priceAsc: { salePrice: 1 },
            priceDesc: { salePrice: -1 },
            newArrivals: { createdAt: -1 }
        };

        // Determine sorting criteria
        const sortQuery = sortOptions[sort] || sortOptions.newArrivals;

        // Fetch filtered, sorted, and paginated products
        const products = await Product.find(query)
            .sort(sortQuery)
            .collation({ locale: 'en', strength: 1 }) // Case-insensitive sorting
            .populate({ path: 'category', match: { isListed: true } });

        // Fetch all categories for filtering options
        const categories = await Category.find({ isListed: true });

        // Retrieve user information, if available
        const userId = req.session.user;
        const user = userId ? await User.findById(userId) : null;

        let wishlistProductIds = [];
        if (user) {
            wishlistProductIds = user.wishlist;  // Assuming 'wishlist' is an array of product IDs in the user model
        }

        // Render the shop page with the required data
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
            searchQuery: search || ''   ,   
            wishlistProductIds
        });

    } catch (error) {
        console.error('Error loading shopping page:', error);
        res.status(500).send('Server Error');
    }
};

















const loadLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("login", { email: '' })
        } else {
            res.redirect("/")
        }
    } catch (error) {
        console.error("Error loading login page", error);
        res.redirect("/pageNoFound")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ isAdmin: 0, email: email });

        if (!findUser) {
            return res.render("login", { message: "User not found", email });
        }

        if (findUser.isGoogleUser) {
            return res.render("login", { message: "User already exists. Please sign in using Google.", email });
        }

        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin", email });
        }

        if (!findUser.password) {
            console.error("No password found for user:", findUser.email);
            return res.render("login", { message: "Login failed. This account is associated with Google sign-in. Please sign in using Google.", email });
        }

        // Password comparison
        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect Password", email });
        }

        req.session.user = findUser._id; 
        res.redirect("/"); 
    } catch (error) {
        console.error("Login error:", error.message); // Log specific error details for debugging
        res.render("login", { message: "Login failed. Please try again later.", email: req.body.email });
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

       
        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

        
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

        return res.render("home", { user: user, products: productData, currentPage: 'home',wishlistProductIds });

    } catch (error) {
        console.log('Home page not found', error);
        res.status(500).send('Server error');
    }
}


const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("session destruction error".err.message);
                return res.redirect("/pageNotFound");
            }
            return res.redirect("/login")
        })
    } catch (error) {
        console.log("logout error", error);
        res.redirect("/pageNotFound");
    }
}




module.exports = {
    loadHomepage,
    pageNotFound,
    loadShopping,
    loadSignup,
    signUp,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    getAllproducts,
    loadProductPage,
    submitReview,
    deleteReview,

}