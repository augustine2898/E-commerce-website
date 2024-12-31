const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");
const Coupon = require("../../models/couponSchema")
const Wallet = require("../../models/walletSchema")
const Razorpay = require("razorpay")
const crypto = require('crypto');

const env = require("dotenv").config()


const getCheckoutPage = async (req, res) => {
    try {
        const user = req.session.user;

        if (!user) {
            console.error("User not logged in or session expired.");
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        const cart = await Cart.findOne({ userID: user }).populate('items.productId', 'productName');

        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ success: false, message: "No items in the cart" });
        }

        //Calculate subtotal
        const subtotal = cart.items.reduce((total, item) => {
            if (isNaN(item.price) || isNaN(item.quantity)) {
                return total;
            }
            const itemTotal = item.price * item.quantity;
            return total + itemTotal;
        }, 0);



        console.log(subtotal);

        let discount = 0;
        if (cart.couponCode) {
            const coupon = await Coupon.findOne({ name: cart.couponCode, isList: true });

            if (coupon && subtotal >= coupon.minimumPrice) {
                if (coupon.discountType === "Percentage") {
                    discount = (coupon.offerPrice / 100) * subtotal;
                } else {
                    discount = coupon.offerPrice;
                }
            } else {
                cart.couponCode = null;
            }
        }


        const totalBeforeShipping = Math.max(subtotal - discount, 0);

        const shippingCharge = totalBeforeShipping < 2000 ? 100 : 0;

        const total = totalBeforeShipping + shippingCharge;

        console.log(total)

        const couponDetails = cart.couponCode
            ? {
                couponCode: cart.couponCode,
                discount,
            }
            : null;


        const userData = await User.findById(user);
        const addresses = await Address.find({ userId: userData.id }).lean();

        if (!userData) {
            console.error("User data not found.");
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Render the checkout page
        res.render('checkout', {
            user: userData,
            cartItems: cart.items,
            subtotal,
            total,
            shippingCharge,
            couponDetails,
            addresses,
            currentPage: 'checkout',
            message: req.query.message || '',
            success: req.query.success === 'true',
            cart,
        });

    } catch (err) {
        console.error("Error in getCheckoutPage:", err);
        res.status(500).json({ success: false, message: "Error retrieving checkout details" });
    }
};



const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const placeOrder = async (req, res) => {
    try {
        const user = req.session.user;
        const {
            c_select_address,
            c_diff_address,
            c_order_notes,
            payment_method,
            new_country,
            new_fname,
            new_lname,
            new_address_detail,
            new_state_country,
            new_postal_zip,
            new_phone
        } = req.body;

        if (!user) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        const cart = await Cart.findOne({ userID: user })
            .populate({
                path: 'items.productId',
                populate: { path: 'category', model: 'Category' }
            });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        let subtotal = 0;
        let offerDiscount = 0;

        const orderItems = cart.items.map(item => {
            const product = item.productId;
            const category = product.category;

            const productOfferDiscount = product.productOffer
                ? (product.regularPrice * product.productOffer) / 100
                : 0;

            const categoryOfferDiscount = category.categoryOffer
                ? (product.regularPrice * category.categoryOffer) / 100
                : 0;

            const appliedDiscount = Math.max(productOfferDiscount, categoryOfferDiscount);

            const itemTotalPrice = product.regularPrice * item.quantity;

            subtotal += itemTotalPrice;
            offerDiscount += appliedDiscount * item.quantity;

            return {
                product: product._id,
                quantity: item.quantity,
                price: product.regularPrice,
                appliedDiscount
            };
        });

        const couponDiscount = cart.discount || 0;
        const totalDiscount = offerDiscount + couponDiscount;
        const finalAmount = subtotal - totalDiscount;

        let deliveryCharge = 0; // Initialize deliveryCharge
        if (finalAmount < 2000) {
            deliveryCharge = 100;
        }

        const finalAmountWithDelivery = finalAmount + deliveryCharge;

        let address;
        if (c_select_address) {
            address = await Address.findOne({ _id: c_select_address, userId: user });
            if (!address) {
                return res.status(400).json({ success: false, message: "Selected address not found" });
            }
        }

        if (!address || !address._id) {
            return res.status(500).json({ success: false, message: "Error retrieving or creating address" });
        }

        let order;

        // Razorpay payment method
        if (payment_method === 'razorpay') {
            try {
                const razorpayOrder = await razorpayInstance.orders.create({
                    amount: finalAmountWithDelivery * 100,
                    currency: "INR",
                    receipt: `receipt_${new Date().getTime()}`
                });

                order = new Order({
                    user: user,
                    orderItems,
                    totalPrice: subtotal,
                    offerDiscount,
                    couponDiscount,
                    discount: totalDiscount,
                    finalAmount: finalAmountWithDelivery,
                    couponCode: cart.couponCode || null,
                    address: address._id,
                    invoiceDate: new Date(),
                    status: 'Payment Pending',
                    paymentMethod: 'Razorpay',
                    razorpayOrderId: razorpayOrder.id,
                });

                await order.save();

                cart.items.forEach(async (item) => {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity += item.quantity; // Add quantity back to stock
                        await product.save();
                    }
                });

                cart.items = [];
                cart.couponCode = null;
                cart.couponDiscount = 0;
                await cart.save();

                return res.status(200).json({
                    success: true,
                    message: "Razorpay order created",
                    razorpayOrderId: razorpayOrder.id,
                    orderId: order._id,
                    totalAmount: finalAmountWithDelivery,
                });
            } catch (error) {
                // If Razorpay payment fails
                order.status = 'Payment Pending';
                await order.save();
                cart.items.forEach(async (item) => {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.quantity += item.quantity; // Add quantity back to stock
                        await product.save();
                    }
                });

                cart.items = [];
                cart.couponCode = null;
                cart.couponDiscount = 0;
                await cart.save();
                return res.status(500).json({ success: false, message: "Payment failed. Please try again.", orderId: order._id });
            }
        }
        // Wallet payment method
        else if (payment_method === 'wallet') {
            const wallet = await Wallet.findOne({ user: user });
            if (!wallet) {
                return res.status(400).json({ message: 'Wallet not found.' });
            }

            if (wallet.balance < finalAmountWithDelivery) {
                order = new Order({
                    user: user,
                    orderItems,
                    totalPrice: subtotal,
                    offerDiscount,
                    couponDiscount,
                    discount: totalDiscount,
                    finalAmount: finalAmountWithDelivery,
                    couponCode: cart.couponCode || null,
                    address: address._id,
                    invoiceDate: new Date(),
                    status: 'Payment Pending',
                    paymentMethod: 'Wallet',
                });
                await order.save();
                cart.items = [];
                cart.couponCode = null;
                cart.couponDiscount = 0;
                await cart.save();

                return res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance. Payment pending.',
                    orderId: order._id,
                });
            }

            wallet.balance -= finalAmountWithDelivery;
            await wallet.save();

            order = new Order({
                user: user,
                orderItems,
                totalPrice: subtotal,
                offerDiscount,
                couponDiscount,
                discount: totalDiscount,
                finalAmount: finalAmountWithDelivery,
                couponCode: cart.couponCode || null,
                address: address._id,
                invoiceDate: new Date(),
                status: 'Paid',
                paymentMethod: 'Wallet',
            });

            await order.save();

            cart.items = [];
            cart.couponCode = null;
            cart.couponDiscount = 0;
            await cart.save();

            return res.status(200).json({
                success: true,
                message: 'Order placed successfully!',
                orderId: order._id,
                totalAmount: finalAmount,
            });
        }


        else if (payment_method === 'cash_on_delivery') {

            if (finalAmount > 1000) {
                return res.status(400).json({
                    success: false,
                    message: "Orders above Rs 1000 are not allowed for Cash on Delivery."
                });
            }
            order = new Order({
                user: user,
                orderItems,
                totalPrice: subtotal,
                offerDiscount,
                couponDiscount,
                discount: totalDiscount,
                finalAmount: finalAmountWithDelivery,
                couponCode: cart.couponCode || null,
                address: address._id,
                invoiceDate: new Date(),
                status: 'Processing',
                paymentMethod: 'COD',
            });

            await order.save();

            // Clear the cart after placing the order
            cart.items = [];
            cart.couponCode = null;
            cart.couponDiscount = 0;
            await cart.save();

            return res.status(200).json({
                success: true,
                message: 'Order placed successfully with Cash on Delivery!',
                orderId: order._id,
                totalAmount: finalAmountWithDelivery,
            });
        }
        else {
            return res.status(400).json({ success: false, message: "Invalid payment method" });
        }


    } catch (err) {
        console.error("Error in placing order:", err.message);
        res.status(500).json({ success: false, message: "Error placing the order", error: err.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body.payment;
        console.log(req.body.payment)
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment details" });
        }

        // Generate the signature to verify
        const generated_signature = crypto.createHmac('sha256', razorpayInstance.key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        console.log(razorpay_order_id)

        // Find the order by Razorpay order ID
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        console.log(Order)
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update order details after successful payment
        order.status = 'Paid';
        order.statusDates.Paid = new Date();
        order.invoiceDate = new Date();
        // Add payment details
        order.paymentDetails = {
            razorpay_payment_id,
            razorpay_signature
        };

        await order.save();

        // Clear the cart after successful payment
        const cart = await Cart.findOne({ userID: order.user });
        if (cart) {
            cart.items = [];
            cart.couponCode = null;
            cart.couponDiscount = 0;
            await cart.save();
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            orderId: order.orderId,
            status: order.status
        });
    } catch (err) {
        console.error("Error verifying payment:", err.message);
        return res.status(500).json({ success: false, message: "Error verifying payment", error: err.message });
    }
};

const postaddAddress = async (req, res) => {
    try {
        
        const { firstName, lastName, landmark, address, city, state, pincode, phone, altPhone } = req.body;

        
        console.log("reqbody", req.body);

        
        if (!firstName || !lastName || !landmark || !address || !city || !state || !pincode || !phone) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

       
        const newAddress = new Address({
            userId: req.session.user,
            address: [{
                addressType: 'home',
                name: `${firstName} ${lastName}`,
                city: city,
                landMark: landmark,  
                addressDetail: address,
                state,
                pincode,  
                phone,
                altPhone: altPhone || '',  
            }]
        });

        console.log(newAddress);  

       
        await newAddress.save();

        res.status(201).json({
            success: true,  
            message: 'Address added successfully.',
            newAddressId: newAddress._id
        });
    } catch (error) {
        console.error('Error adding address:', error);  
        res.status(500).json({ message: 'Server error while adding address.' });
    }
};


const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log("req:", req.params);
        const user = req.session.user;

        if (!user) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        
        let order = await Order.findById(orderId);
        if (!order) {
            return res.status(400).json({ success: false, message: "Order not found" });
        }

        if (order.status !== 'Payment Pending') {
            return res.status(400).json({ success: false, message: "Order is not in a valid state to retry payment" });
        }

        const payment_method = req.body.payment_method;
        const finalAmountWithDelivery = order.finalAmount;

        console.log(payment_method);

        if (payment_method === 'razorpay') {
            try {
                // Create a Razorpay order
                const razorpayOrder = await razorpayInstance.orders.create({
                    amount: finalAmountWithDelivery * 100, 
                    currency: "INR",
                    receipt: `receipt_${new Date().getTime()}`
                });

                
                order.razorpayOrderId = razorpayOrder.id;
                order.status = 'Payment Pending'; 
                order.invoiceDate = new Date(); 
                order.paymentMethod= 'Razorpay'
                console.log(order.createdOn)
                for (let item of order.orderItems) {
                    console.log("Product ID:", item.product); 
                
                    
                    const product = await Product.findById(item.product); 
                    if (product) {
                        console.log("Found product:", product); 
                        product.quantity -= item.quantity; 
                        await product.save();
                    } else {
                        console.log(`Product not found for ID: ${item.product}`);
                    }
                }
    
                
                await order.save();

                return res.status(200).json({
                    success: true,
                    message: "Razorpay order created",
                    razorpayOrderId: razorpayOrder.id,
                    orderId: order._id,
                    totalAmount: finalAmountWithDelivery,
                });
            } catch (error) {
                console.error("Error creating Razorpay order:", error.message);
                return res.status(500).json({ success: false, message: "Error creating Razorpay order. Please try again." });
            }
        }

        else if (payment_method === 'wallet') {
            
            const wallet = await Wallet.findOne({ user: user });
            if (!wallet) {
                return res.status(400).json({ message: 'Wallet not found.' });
            }

            if (wallet.balance < finalAmountWithDelivery) {
 
                order.status = 'Payment Pending'; 
                await order.save();
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance. Payment pending.',
                    orderId: order._id,
                });
            }

            wallet.balance -= finalAmountWithDelivery;
            await wallet.save();

            order.status = 'Paid';
            order.paymentMethod = 'Wallet';
            order.createdOn = new Date(); 
            for (let item of order.orderItems) {
                console.log("Product ID:", item.product); 
            
                
                const product = await Product.findById(item.product); 
                if (product) {
                    console.log("Found product:", product); 
                    product.quantity -= item.quantity; 
                    await product.save();
                } else {
                    console.log(`Product not found for ID: ${item.product}`);
                }
            }
            await order.save();

            return res.status(200).json({
                success: true,
                message: 'Order placed successfully with Wallet!',
                orderId: order._id,
                totalAmount: finalAmountWithDelivery,
            });
        }

        else if (payment_method === 'cash_on_delivery') {
            if (finalAmountWithDelivery > 1000) {
                return res.status(400).json({
                    success: false,
                    message: "Orders above Rs 1000 are not allowed for Cash on Delivery."
                });
            }

            
            order.status = 'Processing';
            order.paymentMethod = 'COD';
            console.log("af",order.createdOn)
            order.createdOn = new Date(); 
            console.log(order.createdOn)
            for (let item of order.orderItems) {
                console.log("Product ID:", item.product); 
            
                
                const product = await Product.findById(item.product); 
                if (product) {
                    console.log("Found product:", product); 
                    product.quantity -= item.quantity; 
                    await product.save();
                } else {
                    console.log(`Product not found for ID: ${item.product}`);
                }
            }
            
            await order.save();

            return res.status(200).json({
                success: true,
                message: 'Order placed successfully with Cash on Delivery!',
                orderId: order._id,
                totalAmount: finalAmountWithDelivery,
            });
        }

       
        else {
            return res.status(400).json({ success: false, message: "Invalid payment method" });
        }

    } catch (err) {
        console.error("Error retrying payment:", err.message);
        return res.status(500).json({ success: false, message: "Error retrying the payment", error: err.message });
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
        let userId = req.session.user

        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }
        res.render('edit-address-checkout', {
            address,
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
        city,
        zip,
        phone,
        altPhone,
    } = req.body;

    try {

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).send({ message: 'Address not found.' });
        }


        const fullName = `${firstName} ${lastName}`;
        address.address[0].name = fullName;
        address.address[0].landMark = landmark;
        address.address[0].addressDetail = addressDetail;
        address.address[0].state = state;
        address.address[0].city = city;
        address.address[0].pincode = zip;
        address.address[0].phone = phone;
        address.address[0].altPhone = altPhone;


        await address.save();


        return res.status(200).send({ message: 'Address updated successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error updating address.' });
    }
};






module.exports = {
    getCheckoutPage,
    placeOrder,
    getEditAddress,
    postEditAddress,
    verifyPayment,
    postaddAddress,
    retryPayment,
};
