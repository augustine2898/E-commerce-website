const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Order =require("../../models/orderSchema")
const Wallet =require("../../models/walletSchema")
const mongoose = require("mongoose");
const PDFDocument = require('pdfkit');
const fs = require('fs');

const Orderdetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Check if orderId is valid
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error("Invalid orderId:", orderId);
      return res.status(400).send("Invalid Order ID");
    }

    // Check if user is logged in
    const userId = req.session.user;
    if (!userId) {
      return res.redirect("/login"); // Redirect to login if user session is missing
    }

    // Fetch order and user data in parallel
    const [order, userData] = await Promise.all([
      Order.findById(orderId)
        .populate("orderItems.product") // Populate product details
        .populate("user")               // Populate user details
        .populate("address")            // Populate address details
        .exec(),
      User.findById(userId).exec()    // Fetch user data concurrently
    ]);

    // Check if order exists
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Preprocess order data
    const preprocessedOrder = {
      ...order.toObject(),
      formattedDate: new Date(order.createdOn).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };

    // Render the page with the necessary data
    res.render("orderdetailpage", {
      order: preprocessedOrder,  // Pass the preprocessed order
      user: userData,
      currentPage: "profile",
    });

  } catch (error) {
    console.error("Error fetching order details:", error);
    next(error); // Use next() to forward errors to a global error handler
  }
};

  
const cancelOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
      const order = await Order.findById(orderId).populate('orderItems.product');

      if (!order) {
          return res.status(404).json({ message: 'Order not found.' });
      }

      // Allow cancellation only if the order is in 'Pending', 'Processing', or 'Paid' state
      if (!['Pending', 'Processing', 'Paid'].includes(order.status)) {
          return res.status(400).json({ message: 'Order cannot be canceled at this stage.' });
      }

      // Update order status to 'Canceled' and set cancellation date
      order.status = 'Canceled';
      order.statusDates.Canceled = new Date();

      // Update product quantities concurrently
      const updateProductQuantities = order.orderItems.map(item => {
          const product = item.product;
          if (product) {
              product.quantity += item.quantity; // Return the quantity to stock
              return product.save();
          }
      });

      // Handle wallet balance update based on payment method
      const updateWallet = async (paymentMethod) => {
          const wallet = await Wallet.findOne({ user: order.user }) || new Wallet({ user: order.user, balance: 0, transactions: [] });

          wallet.balance += order.finalAmount;
          wallet.transactions.push({
              from: order.user, 
              to: order.user,   
              amount: order.finalAmount,
              transactionType: 'cancel',
          });

          return wallet.save();
      };

      let walletUpdate;

      // Check if payment method requires wallet update
      if (['Razorpay', 'Wallet'].includes(order.paymentMethod)) {
          walletUpdate = updateWallet(order.paymentMethod);
      } else if (order.paymentMethod === 'COD' && order.status === 'Delivered') {
          walletUpdate = updateWallet(order.paymentMethod);
      }

      // Wait for all async operations to finish
      await Promise.all([...updateProductQuantities, walletUpdate]);

      // Save the updated order
      await order.save();

      res.status(200).json({
          message: 'Order has been canceled successfully. Product quantities updated, and wallet credited for prepaid methods.',
      });
  } catch (error) {
      console.error('Error canceling order:', error);
      res.status(500).json({ message: 'An error occurred while canceling the order.' });
  }
};


const returnOrder = async (req, res) => {
    const orderId = req.params.id;
    const returnPeriod = 7; 

    try {
        const order = await Order.findById(orderId).populate('orderItems.product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        
        if ((order.paymentMethod === 'COD' || order.paymentMethod === 'Wallet') && order.status !== 'Delivered') {
            return res.status(400).json({ message: 'Order is not delivered yet; cannot process return.' });
        }

      
        const currentDate = new Date();
        const deliveryDate = new Date(order.statusDates.Delivered);
        const timeDifference = (currentDate - deliveryDate) / (1000 * 3600 * 24);

        if (timeDifference > returnPeriod) {
            return res.status(400).json({ message: 'Return period has expired.' });
        }

       
        order.status = 'Return Requested';
        order.statusDates.Return_Requested = new Date();

   
        for (const item of order.orderItems) {
            const product = item.product;
            if (product) {
                product.quantity += item.quantity;
                await product.save();
            }
        }

        
        const userId = order.user;

        
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
        }

        if (order.paymentMethod === 'COD' || order.paymentMethod === 'Wallet') {
      
            wallet.balance += order.finalAmount;
            wallet.transactions.push({
                from: userId,
                to: userId,
                amount: order.finalAmount,
                transactionType: 'return',
            });

            await wallet.save();
        } else if (order.paymentMethod === 'Razorpay') {
        
            wallet.balance += order.finalAmount;
            wallet.transactions.push({
                from: userId,
                to: userId,
                amount: order.finalAmount,
                transactionType: 'return',
            });

            await wallet.save();
        }

        await order.save();

        res.status(200).json({
            message: 'Return request has been initiated successfully. Await admin approval.',
            order,
        });
    } catch (error) {
        console.error('Error initiating return:', error);
        res.status(500).json({ message: 'An error occurred while processing the return request.' });
    }
};

const downloadInvoice = async (req, res) => {
    try {
      const orderId = req.params.orderId;
  
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).send('Invalid Order ID');
      }
  
      const order = await Order.findById(orderId)
        .populate('orderItems.product')
        .populate('user')
        .populate('address')
        .exec();
      console.log(order)
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      // Check user session
      const userId = req.session.user;
      if (!userId) {
        return res.redirect('/login');
      }
  
      const doc = new PDFDocument();
  
      // Filename for download
      const filename = `Invoice-${order._id}.pdf`;
  
      // Set headers
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');
  
      // Pipe PDF to response
      doc.pipe(res);
  
      // Header
      doc.fontSize(20).text('Order Invoice', { align: 'center' });
      doc.moveDown();
  
      // Order Details
      doc.fontSize(14).text(`Order ID: ${order._id}`);
      doc.text(`Order Date: ${new Date(order.createdOn).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`);
      doc.text(`Status: ${order.status}`);
      doc.moveDown();
  
      // User Details
      doc.fontSize(16).text('Customer Details');
      doc.fontSize(12).text(`Name: ${order.user.name}`);
      doc.text(`Email: ${order.user.email}`);
      doc.text(`Phone: ${order.user.phone || 'N/A'}`);
      doc.moveDown();
  
      // Address
      doc.fontSize(16).text('Shipping Address');
      if (order.address && order.address.address.length > 0) {
        const address = order.address.address[0];
        doc.fontSize(12).text(`${address.name}`);
        doc.text(`${address.addressDetail}`);
        doc.text(`${address.city}, ${address.state}, ${address.pincode}`);
        doc.text(`Phone: ${address.phone}`);
      } else {
        doc.fontSize(12).text('No address found for this order.');
      }
      doc.moveDown();
  
      //payment method
      doc.fontSize(16).text('Payment Method');
      doc.fontSize(12).text(`${order.paymentMethod}`)
      // Order Items
      doc.fontSize(16).text('Order Items');
      order.orderItems.forEach(item => {
        doc.fontSize(12).text(`${item.product.productName} - Qty: ${item.quantity} - Price: ₹${item.product.salePrice || item.product.regularPrice}`);
      });
      doc.moveDown();
  
      // Total Price
      if (order.offerDiscount > 0) {
        doc.text(`Offer Discount: -₹${order.offerDiscount.toFixed(2)}`);
    }
    if (order.couponDiscount > 0) {
        doc.text(`Coupon Discount: -₹${order.couponDiscount.toFixed(2)}`);
    }
    if (order.discount > 0) {
        doc.text(`Total Discount: -₹${order.discount.toFixed(2)}`);
    }
    doc.text(`Subtotal: ₹${order.totalPrice.toFixed(2)}`);
    doc.text(`Total: ₹${order.finalAmount.toFixed(2)}`, { underline: true });
  
      // Finalize PDF and end stream
      doc.end();
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  module.exports={
    Orderdetails,
    cancelOrder,
    returnOrder,
    downloadInvoice,
  }