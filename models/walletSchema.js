const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, 
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Prevent negative transaction amounts
    },
    transactionType: {
      type: String,
      required: true,
      enum: ['cancel', 'return', 'wallet-order'], // Restrict to valid transaction types
    },
    status: {
      type: String,
      required: true,
      enum: ['Completed', 'Failed'], // Distinguish between successful and failed transactions
      default: 'Completed',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
});

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
