const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
  orderId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  razorpayOrderId: { 
    type: String, 
    default: '' // This field stores the Razorpay order ID
  },
  orderItems: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      default: 0, // Regular price of the product
    },
    appliedDiscount: {
      type: Number,
      default: 0, // Total discount applied (productOffer or categoryOffer)
    },
    discountType: {
      type: String,
      enum: ['Product Offer', 'Category Offer', 'None'], // Type of discount applied
      default: 'None',
    },
  }],
  totalPrice: {
    type: Number,
    required: true, // Total before discounts
  },
  offerDiscount: {
    type: Number,
    default: 0, // Total discount from offers (sum of appliedDiscount from items)
  },
  couponDiscount: {
    type: Number,
    default: 0, // Discount from the applied coupon
  },
  discount: {
    type: Number,
    default: 0, // Total discount (offerDiscount + couponDiscount)
  },
  finalAmount: {
    type: Number,
    required: true, // Total after applying all discounts
  },
  address: { 
    type: Schema.Types.ObjectId,
    ref: "Address", 
  },
  user: { 
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invoiceDate: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    enum: ['Payment Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled', 'Return Requested', 'Returned','Return Request Canceled','Paid'],
  },
  statusDates: {
    Pending: { type: Date , default: Date.now },
    Processing: { type: Date },
    Shipped: { type: Date },
    Delivered: { type: Date },
    Canceled: { type: Date },
    Return_Requested: { type: Date },
    Returned: { type: Date },
    Return_Requested_canceled: { type: Date }
  },
  createdOn: {
    type: Date,
    default: Date.now,
    required: true,
  },
  couponApplied: {
    type: Boolean,
    default: false,
  },
  couponCode: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Razorpay','Wallet'],
    required: true,
    default: 'COD',
  },
  paymentDetails: {
    razorpay_payment_id: { type: String,default: '' },
    razorpay_signature: { type: String,default: '' }
  }
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
