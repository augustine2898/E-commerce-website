const mongoose = require("mongoose");
const { Schema } = mongoose;

const brandSchema = new Schema({
    brandName: {
        type: String,
        required: true
    },
    brandImage: {
        type: [String],
        required: true,
    },
    isBolocked: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        defualt: Date.now
    }
})


const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;