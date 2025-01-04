const Review = require("../../models/ReviewSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");


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


module.exports={
    submitReview,
    deleteReview,
}