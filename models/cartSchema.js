const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema= new Schema({

    userID:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            required:true,
        },
        totalPrice:{
            type:Number,
            required:true,
        },
        status:{
            type:String,
            default:'placed'
        },
        cancellationReason:{
            type:String,
            default:"none",
        },
       
    }],
    couponCode: {            
        type: String,
        default: ''
    },
    discount: {             
        type: Number,
        default: 0
    },

});


const Cart =mongoose.model("Cart",cartSchema);
module.exports =Cart;