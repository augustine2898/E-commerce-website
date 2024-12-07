const Product = require("../../models/productSchema");
const Category = require("../../models/CategorySchema");
const User = require("../../models/userSchema");
const Order =require("../../models/orderSchema")


const getAllOrders = async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('user')
        .populate('orderItems.product')
        .populate('address');
        console.log(orders);

       // order.createdAt = new Date(order.createdAt);
  
      // Add pagination if needed
      const page = parseInt(req.query.page) || 1;
      const totalOrders = await Order.countDocuments();
      const totalPages = Math.ceil(totalOrders / 10); // assuming 10 orders per page
  
      res.render('order', {
        orders,
        page,
        totalPages,
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

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'Canceled') {
            return res.status(400).json({ success: false, message: 'Cannot update the status of a canceled order' });
        }

        order.status = status;
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
