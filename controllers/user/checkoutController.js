const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");

const getCheckoutPage = async (req, res) => {
    try {
        const user = req.session.user;

        // Check if user is logged in
        if (!user) {
            console.error("User not logged in or session expired.");
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        // Fetch the user's cart
        const cart = await Cart.findOne({ userID: user }).populate('items.productId', 'productName');

        // Check if the cart is empty
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ success: false, message: "No items in the cart" });
        }

        // Calculate the subtotal of the cart
        const subtotal = cart.items.reduce((total, item) => {
            if (isNaN(item.price) || isNaN(item.quantity)) {
                return total;
            }
            const itemTotal = item.price * item.quantity;
            return total + itemTotal;
        }, 0);

        const total = subtotal;

        // Fetch the user's data and addresses
        const userData = await User.findById(user);
        console.log(userData)
        const addresses = await Address.find({ userId: userData.id }).lean();  // Using lean() for plain JavaScript objects
        console.log(addresses)
        // Check if user data was found
        if (!userData) {
            console.error("User data not found.");
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Render the checkout page with the necessary data
        res.render('checkout', {
            user: userData,
            cartItems: cart.items,
            subtotal,
            total,
            addresses,
            currentPage: 'checkout',
            message: req.query.message || '',
            success: req.query.success === 'true'
        });

    } catch (err) {
        console.error("Error in getCheckoutPage:", err);
        res.status(500).json({ success: false, message: "Error retrieving checkout details" });
    }
};

const placeOrder = async (req, res) => {
    try {
        const user = req.session.user;
        const {
            c_select_address,
            c_diff_address,
            c_code,
            c_order_notes,
            new_country,
            new_fname,
            new_lname,
            new_address_detail,
            new_state_country,
            new_postal_zip,
            new_phone
        } = req.body;

        if (!user) {
            console.error("User not logged in or session expired.");
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        // Find the user's cart
        const cart = await Cart.findOne({ userID: user }).populate('items.productId', 'productName');
        if (!cart || cart.items.length === 0) {
            console.error("Cart not found or empty.");
            return res.status(404).json({ success: false, message: "No items in the cart" });
        }

        // Calculate subtotal
        const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const total = subtotal;

        let address;
        const userData = await User.findById(user);
        // Handle address selection or creation
        if (c_select_address) {
            console.log(c_select_address)
            address = await Address.findOne({ _id: c_select_address, userId: userData._id });
            console.log(address)
            if (!address) {
                console.error("Selected address not found or invalid.");
                return res.status(400).json({ success: false, message: "Selected address not found" });
            }
        }
        else if (c_diff_address) {
            address = new Address({
                userId: user,
                firstName: new_fname,
                lastName: new_lname,
                addressDetail: new_address_detail,
                city: new_state_country,
                state: new_state_country,
                pincode: new_postal_zip,
                country: new_country,
                phone: new_phone
            });
            await address.save();
        }

        if (!address || !address._id) {
            console.error("Address not found or could not be created.");
            return res.status(500).json({ success: false, message: "Error retrieving or creating address" });
        }

        // Create new order and pass the user ID
        const order = new Order({
            user: userData._id,  // Add the user field here
            orderItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.price
            })),
            totalPrice: subtotal,
            finalAmount: total,
            address: address._id,
            invoiceDate: new Date(),
            status: 'Pending',
            couponApplied: c_code || false,
           
        });

        await order.save();

        // Clear the cart after placing order
        cart.items = [];
        await cart.save();

        // Respond with success
        res.status(200).json({ success: true, message: 'Order placed successfully!', orderId: order._id, totalAmount: total });

    } catch (err) {
        console.error("Error in placing order:", err.message); // Detailed error logging
        res.status(500).json({ success: false, message: "Error placing the order", error: err.message });
    }
};

const getEditAddress = async (req, res) => {
    const addressId = req.params.id; 
  
    try {
      const address = await Address.findById(addressId); 
      if (!address) {
        return res.status(404).send({ message: 'Address not found.' });
      }
  
      let user = null;
        let userId=req.session.user
        // Check if userId is available and fetch user
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }
      res.render('edit-address-checkout', { address,
            currentPage: 'checkout',
            user,
       });
    } catch (error) {
      res.status(500).send({ message: 'Error retrieving address details.' });
    }
  };

  const postEditAddress = async (req, res) => {
    const addressId = req.params.id; 
    const {
        firstName,
        lastName,
        landmark,
        addressDetail,
        state,
        zip,
        phone,
        altPhone,
    } = req.body; // Destructure the data from the request body

    try {
        // Find the address by ID
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).send({ message: 'Address not found.' });
        }

        // Update the address fields
        const fullName = `${firstName} ${lastName}`;
        address.address[0].name = fullName;
        address.address[0].landMark = landmark;
        address.address[0].addressDetail = addressDetail;
        address.address[0].state = state;
        address.address[0].pincode = zip;
        address.address[0].phone = phone;
        address.address[0].altPhone = altPhone;

        // Save the updated address
        await address.save();

        // Respond with success message
        return res.status(200).send({ message: 'Address updated successfully!' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ message: 'Error updating address.' });
    }
};






module.exports = {
    getCheckoutPage,
    placeOrder,
    getEditAddress,
    postEditAddress

};
