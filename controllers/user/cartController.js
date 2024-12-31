const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema")
const Product =require("../../models/productSchema")
const Coupon = require("../../models/couponSchema")



const getMyCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userID: req.session.user }).populate('items.productId');
        const availableCoupons = await Coupon.find({ isList: true, expireOn: { $gte: new Date() } }); // Filter active coupons
        console.log(availableCoupons);
        
        if (!cart) {
            cart = new Cart({ items: [], subtotal: 0, total: 0, couponCode: null, discount: 0 }); // Ensure cart is initialized
        } else {
            // Calculate subtotal
            cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

            if (cart.couponCode) {
                const coupon = await Coupon.findOne({ name: cart.couponCode, isList: true });

                if (coupon && cart.subtotal >= coupon.minimumPrice) {
                    // Calculate discount based on discount type
                    if (coupon.discountType === "Percentage") {
                        cart.discount = (coupon.offerPrice / 100) * cart.subtotal;
                    } else {
                        cart.discount = coupon.offerPrice; // Fixed amount discount
                    }

                    cart.total = Math.max(cart.subtotal - cart.discount, 0);
                } else {
                    cart.couponCode = null;
                    cart.discount = 0;
                    cart.total = cart.subtotal;
                }
            } else {
                cart.discount = 0;
                cart.total = cart.subtotal;
            }
        }

        await cart.save(); // Save the updated cart

        const user = req.session.user ? await User.findById(req.session.user) : null;
        if (!user) {
            return res.redirect("/login");
        }

        res.render('cart', { cart, currentPage: 'cart', user, availableCoupons }); // Render cart with available coupons
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).send('Server error');
    }
};



const updateCart = async (req, res) => {
    try {
        const { itemId, newQuantity } = req.body;
        const userId = req.session.user;

        if (newQuantity < 0) {
            return res.status(400).json({ message: "Quantity cannot be negative." });
        }

        const MAX_QUANTITY = 3;

        const cart = await Cart.findOne({ userID: userId }).populate('items.productId');
        if (!cart) return res.status(404).json({ message: "Cart not found." });

        const item = cart.items.find(i => i._id.toString() === itemId);
        if (!item) return res.status(404).json({ message: "Item not found in cart." });

        const product = await Product.findById(item.productId._id);

        if (newQuantity === 0) {
            // Remove item from cart
            product.quantity += item.quantity; // Restore stock
            cart.items = cart.items.filter(i => i._id.toString() !== itemId);
        } else if (newQuantity > MAX_QUANTITY) {
            return res.status(400).json({ message: `You can only have ${MAX_QUANTITY} of this product.` });
        } else {
            const quantityDifference = newQuantity - item.quantity;
            if (quantityDifference > 0 && product.quantity < quantityDifference) {
                return res.status(400).json({ message: "Not enough stock available." });
            }

            product.quantity -= quantityDifference; // Adjust stock
            item.quantity = newQuantity;
            item.totalPrice = item.price * newQuantity;
        }

        await product.save();

        // Recalculate subtotal
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

        // Handle coupon application if one exists
        if (cart.couponCode) {
            const coupon = await Coupon.findOne({ name: cart.couponCode, isList: true });

            if (coupon && cart.subtotal >= coupon.minimumPrice) {
                // Calculate discount based on discount type
                if (coupon.discountType === "Percentage") {
                    cart.discount = (coupon.offerPrice / 100) * cart.subtotal;
                } else {
                    cart.discount = coupon.offerPrice;
                }

                // Calculate total after discount
                cart.total = Math.max(cart.subtotal - cart.discount, 0);
            } else {
                // If coupon is invalid or no longer applies, reset coupon details
                cart.couponCode = null;
                cart.discount = 0;
                cart.total = cart.subtotal;
            }
        } else {
            // If no coupon, just set total equal to subtotal
            cart.discount = 0;
            cart.total = cart.subtotal;
        }

        await cart.save();

        res.status(200).json({
            message: "Cart updated successfully.",
            cart: {
                items: cart.items,
                subtotal: cart.subtotal,
                discount: cart.discount,
                total: cart.total,
                couponCode: cart.couponCode,
            },
        });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Server error." });
    }
};


const addToCart = async (req, res) => {
  try {
      const { productId, quantity } = req.body; 
      const userId = req.session.user;

      if (!userId) {
          return res.status(401).json({ message: 'Please log in to add products to your cart' });
      }

      const requestedQuantity = parseInt(quantity) || 1; 
      const MAX_QUANTITY = 2;

      

      const product = await Product.findById(productId);
      if (!product) {
          console.log("Product not found for ID:", productId);
          return res.status(404).json({ message: 'Product not found' });
      }

      if (product.quantity < requestedQuantity) {
          console.log(`Insufficient stock for product ${productId}. Available: ${product.quantity}`);
          return res.status(400).json({ message: 'Not enough stock for this product' });
      }

      let cart = await Cart.findOne({ userID: userId });
      if (!cart) {
          console.log("No cart found for user. Creating new cart...");
          cart = new Cart({
              userID: userId,
              items: [{
                  productId: product._id,
                  quantity: requestedQuantity,
                  price: product.salePrice || product.regularPrice,
                  totalPrice: (product.salePrice || product.regularPrice) * requestedQuantity,
              }],
              totalPrice: (product.salePrice || product.regularPrice) * requestedQuantity,
          });
          product.quantity -= requestedQuantity; 
          await product.save();
          await cart.save();
      } else {
          const productInCart = cart.items.find(item => item.productId.toString() === product._id.toString());
          if (productInCart) {
              const newQuantity = productInCart.quantity + requestedQuantity;
              if (newQuantity > MAX_QUANTITY) {
                  console.log("Exceeds max quantity:", MAX_QUANTITY);
                  return res.status(400).json({ message: `You can only add ${MAX_QUANTITY} of this product to your cart.` });
              }
              productInCart.quantity = newQuantity;
              productInCart.totalPrice = productInCart.price * newQuantity;
              cart.totalPrice += productInCart.price * requestedQuantity;
              product.quantity -= requestedQuantity;
              await product.save();
          } else {
              cart.items.push({
                  productId: product._id,
                  quantity: requestedQuantity,
                  price: product.salePrice || product.regularPrice,
                  totalPrice: (product.salePrice || product.regularPrice) * requestedQuantity,
              });
              cart.totalPrice += (product.salePrice || product.regularPrice) * requestedQuantity;
              product.quantity -= requestedQuantity;
              await product.save();
          }
          await cart.save();
      }

      res.status(200).json({ message: 'Product added to cart', cart });

  } catch (error) {
      console.error("Error adding product to cart:", error); // More detailed logging
      res.status(500).json({ message: 'Server error' });
  }
};


  





const removeProductFromCart = async (req, res) => {
    const userId = req.session.user; 
    const productId = req.body.productId;

    try {
     
        const cart = await Cart.findOne({ userID: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

     
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        const item = cart.items[itemIndex];

        
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

   
        product.quantity += item.quantity;

        
        cart.items.splice(itemIndex, 1);

        
        await cart.save();
        await product.save();

        res.status(200).json({ message: 'Product removed from cart and stock updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while removing the product from the cart' });
    }
};


const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ message: 'Please log in to apply a coupon' });
        }

        
        const coupon = await Coupon.findOne({ name: couponCode, isList: true });
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid or expired coupon code.' });
        }

        
        const currentDate = new Date();
        if (currentDate > coupon.expireOn) {
            return res.status(400).json({ message: 'This coupon has expired.' });
        }

       
        const cart = await Cart.findOne({ userID: userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: 'Cart not found or empty.' });
        }

       
        const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

        
        if (subtotal < coupon.minimumPrice) {
            return res.status(400).json({
                message: `Subtotal must be at least $${coupon.minimumPrice.toFixed(2)} to apply this coupon.`,
            });
        }

       let discount =0
        if (coupon.discountType === "Percentage") {
            discount = (coupon.offerPrice / 100) * subtotal;
            console.log(discount)
        }else{
            discount =coupon.offerPrice
            console.log(discount)
        }

        const finalTotal = subtotal - discount;

        console.log(finalTotal)
        cart.couponCode = couponCode;
        cart.discount = discount;
        cart.total = finalTotal;
        console.log("before cart save:",discount)
        await cart.save();

        
        return res.status(200).json({
            message: 'Coupon applied successfully.',
            subtotal,
            discount,
            finalTotal,
            cart: {
                items: cart.items,
                discount: cart.discount,
                total: cart.total,
                couponCode: cart.couponCode,
            },
        });
    } catch (error) {
        console.error("Error applying coupon:", error);
        res.status(500).json({ message: 'Server error occurred while applying the coupon.' });
    }
};








const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ message: 'Please log in to remove the coupon' });
        }

        
        const cart = await Cart.findOne({ userID: userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: 'Cart not found or empty.' });
        }

        
        if (!cart.couponCode) {
            return res.status(400).json({ message: 'No coupon applied to remove' });
        }

        
        cart.couponCode = '';
        cart.couponDiscount = 0;

        
        const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

        
        const finalTotal = subtotal;

        
        cart.total = finalTotal;
        await cart.save();

        
        return res.status(200).json({
            message: 'Coupon removed successfully.',
            subtotal: subtotal.toFixed(2), 
            discount: 0,  
            finalTotal: finalTotal.toFixed(2),  
            cart: {
                items: cart.items,
                couponCode: cart.couponCode,
                discount: cart.couponDiscount,
                total: cart.total,
            },
        });
    } catch (error) {
        console.error("Error removing coupon:", error);
        res.status(500).json({ message: 'Server error occurred while removing the coupon.' });
    }
};








module.exports = {
    getMyCart,
    addToCart,
    updateCart,
    removeProductFromCart,
    applyCoupon,
    removeCoupon,
}