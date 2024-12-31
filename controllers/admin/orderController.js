const Product = require("../../models/productSchema");
const Category = require("../../models/CategorySchema");
const User = require("../../models/userSchema");
const Order =require("../../models/orderSchema")


const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 8;
    const skip = (page - 1) * limit;
      const orders = await Order.find()
      .populate('user')
      .populate('orderItems.product')
      .populate('address').sort({createdOn:-1})
      .skip(skip)
      .limit(limit)
      console.log(orders);

      // Add pagination if needed
      
      const totalOrders = await Order.countDocuments({})
      const totalPages = Math.ceil(totalOrders / limit)
      res.render('order', {
          orders,
          page,          
          totalPages,    
          currentPage: page,limit
      });
  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
  }
};


  const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        // List of valid statuses
        const validStatuses = [
            'Payment Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Canceled',
            'Return Requested',
            'Returned',
            'Return Request Canceled',
            'Paid',
        ];

        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        
        const order = await Order.findById(orderId).populate('orderItems.product').populate('user');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        
        if (order.status === 'Canceled') {
            return res.status(400).json({ success: false, message: 'Cannot update the status of a canceled order' });
        }

        if (order.status === 'Returned' && status !== 'Return Request Canceled') {
            return res.status(400).json({ success: false, message: 'Cannot update the status of a returned order' });
        }

        
        if (status === 'Return Request Canceled' && order.status !== 'Return Requested') {
            return res.status(400).json({ success: false, message: 'Can only cancel orders with Return Requested status' });
        }

        
        order.status = status;

        
        if (status === 'Returned') {
            
            for (let item of order.orderItems) {
                const product = item.product;
                if (product) {
                    product.quantity += item.quantity; 
                    await product.save();
                }
            }

            
            if (order.paymentMethod === 'COD'||order.paymentMethod === "Razorpay") {
                const user = order.user;
                console.log('User:', user); 
                if (user) {
                    const amountToAdd = parseFloat(order.finalAmount);
                    console.log('Amount to Add:', amountToAdd); t
                    if (!isNaN(amountToAdd) && amountToAdd > 0) {
                        console.log('Adding amount to wallet...'); 
                        user.wallet += amountToAdd;
                        await user.save();
                        console.log('Wallet updated:', user.wallet); 
                    } else {
                        console.error('Invalid finalAmount value:', order.finalAmount);
                    }
                }
            }
        }

        
        if (status in order.statusDates) {
            order.statusDates[status] = new Date();
        }

        
        await order.save();

        return res.json({ success: true, message: 'Order status updated successfully!' });
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
};






module.exports = {
    getAllOrders,
    updateOrderStatus,
};
