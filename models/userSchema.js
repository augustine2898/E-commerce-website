const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String, required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: false,
        unique: false,
        sparse: true,
        default: null
    },

    googleId: {
        type: String,
        unique: true,

    },
    password: {
        type: String,
        required: false,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    cart: [{
        type: Schema.Types.ObjectId,
        ref: "Cart",
    }],
    wallet: {
        type: Number,
        defulat: 0,
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Wishlist",
    }],
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Order",
    }],
    CreateedOn: {
        type: Date,
        default: Date.now,
    },
    referalCode: {
        type: String,
    },
    referalCode: {
        type: Boolean,
    },
    reedemed: {
        type: Boolean
    },
    reedemedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],

    serachHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
        },
        brand: {
            type: String
        },
        searchOn: {
            type: Date,
            default: Date.now,
        }
    }]
})

const User = mongoose.model("User", userSchema);
module.exports = User;