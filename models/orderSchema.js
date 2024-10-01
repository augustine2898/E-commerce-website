const mongoose = require("mongoose");
const { Schema } = mongoose;
const {v4:uuidv4} =require('uuid');

const orderSchema = new Schema({
        orderId:{
            type:String,
            default:()=> uuidv4(),
            unique:true,

        },
        orderItems:[{
            product:{
                type:Schema.Types.ObjectId,
                ref:"Product",
                require:true,
            },
            quantity:{
                type:Number,
                required:true,
            },
            price:{
                type:Number,
                default:0
            },

        }],
        totalPrice:{
            type:Number,
            required:true
        },
        discount:{
            type:Number,
            default:0
        },
        finalAmount:{
            type:Number,
            required:true,
        },
            address:{
                type:Schema.Types.ObjectId,
                ref:"User",
                reuired:true
            },
            invoiveDate:{
                type:Date
            },
            status:{
                type:String,
                required:true,
                enum:['Pending','Processing','Shipped','Delivered','CCancelled','Return Request' ,'Returned']
            },
            cretaedOn:{
                type:Date,
                default:Date.now,
                required:true
            },
            couponApplied:{
                type:Boolean,
                default:false
            }

        
})

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;