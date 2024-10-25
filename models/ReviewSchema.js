const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Reference to the product being reviewed
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the user who wrote the review
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
