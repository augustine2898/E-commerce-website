const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema")
const Product =require("../../models/productSchema")



const getMyCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userID: req.session.user }).populate('items.productId');

        // If the cart does not exist or has no items, use a default structure
        if (!cart) {
            cart = { items: [], subtotal: 0, total: 0 };
        } else {
            // Calculate subtotal by summing the totalPrice of each item
            cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
            
            // Set the total as subtotal (or modify if you want to apply any discounts/taxes)
            cart.total = cart.subtotal;  // Assuming no additional charges for now
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

        res.render('cart', { 
            cart,
            currentPage: 'cart',
            user
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).send('Server error');
    }
};


const addToCart = async (req, res) => {
    try {
      const { productId, quantity } = req.body; // Get productId and quantity from request body
      const userId = req.session.user;
  
      // Validate quantity
      const requestedQuantity = parseInt(quantity) || 1; // Default to 1 if quantity is not provided
      const MAX_QUANTITY = 2;
  
      // Find the product by ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      if (product.quantity < requestedQuantity) {
        return res.status(400).json({ message: 'Not enough stock for this product' });
      }
  
      // Cart logic remains the same, using the requestedQuantity
      let cart = await Cart.findOne({ userID: userId });
      if (!cart) {
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
        product.quantity -= requestedQuantity; // Reduce stock
        await product.save();
        await cart.save();
      } else {
        const productInCart = cart.items.find(item => item.productId.toString() === product._id.toString());
        if (productInCart) {
          const newQuantity = productInCart.quantity + requestedQuantity;
          if (newQuantity > MAX_QUANTITY) {
            return res.status(400).json({ message: `You can only add ${MAX_QUANTITY} of this product to your cart.` });
          }
          if (product.quantity < requestedQuantity) {
            return res.status(400).json({ message: 'Not enough stock for this product' });
          }
          productInCart.quantity = newQuantity;
          productInCart.totalPrice = productInCart.price * newQuantity;
          cart.totalPrice += productInCart.price * requestedQuantity;
          product.quantity -= requestedQuantity;
          await product.save();
        } else {
          if (product.quantity < requestedQuantity) {
            return res.status(400).json({ message: 'Not enough stock for this product' });
          }
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
      console.error("Error adding product to cart:", error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

const updateCart = async (req, res) => {
    try {
        const quantities = req.body.quantities; // Extract quantities from the request body
        const userId = req.session.user;

        
        const MAX_QUANTITY = 2; // You can adjust this value as needed

        const cart = await Cart.findOne({ userID: userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        let totalPrice = 0;

        // Iterate over each item and update its quantity and total price
        for (const itemId in quantities) {
            const item = cart.items.find(item => item._id.toString() === itemId);

            if (item) {
                const newQuantity = quantities[itemId];
                const currentQuantity = item.quantity;

                // Find the product in the inventory
                const product = await Product.findById(item.productId._id);

                // If the quantity is set to zero, remove the item from the cart and adjust stock
                if (newQuantity == 0) {
                    product.quantity += currentQuantity; // Add all of the item's quantity back to stock
                    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
                } else if (newQuantity > MAX_QUANTITY) {
                    // Check if the new quantity exceeds the max quantity per person
                    return res.status(400).json({ message: `You can only have ${MAX_QUANTITY} of this product in your cart.` });
                } else if (newQuantity > currentQuantity) {
                    // Increasing the quantity in the cart, check stock
                    const quantityDifference = newQuantity - currentQuantity;
                    if (product.quantity < quantityDifference) {
                        return res.status(400).json({ message: `Not enough stock for ${product.productName}. Available: ${product.quantity}` });
                    }

                    product.quantity -= quantityDifference; // Decrease stock by the quantity difference
                } else if (newQuantity < currentQuantity) {
                    // Decreasing the quantity in the cart
                    const quantityDifference = currentQuantity - newQuantity;
                    product.quantity += quantityDifference; // Increase stock by the quantity difference
                }

                // Update the cart item
                item.quantity = newQuantity;
                item.totalPrice = item.price * item.quantity;
                totalPrice += item.totalPrice;

                await product.save(); // Save the updated product quantity
            }
        }

        // Update the cart's overall total price
        cart.totalPrice = totalPrice;

        // If there are no items left, set totalPrice to 0
        if (cart.items.length === 0) {
            cart.totalPrice = 0;
        }

        await cart.save();

        res.status(200).json({ message: 'Cart updated successfully', cart });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).send('Server error');
    }
};


const removeProductFromCart = async (req, res) => {
    const userId = req.session.user; 
    const productId = req.body.productId;

    try {
        // Find the user's cart
        const cart = await Cart.findOne({ userID: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item to be removed in the cart
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        const item = cart.items[itemIndex];

        // Update the product stock
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Increase product quantity by the removed item's quantity
        product.quantity += item.quantity;

        // Remove the item from the cart
        cart.items.splice(itemIndex, 1);

        // Save the updated cart and product
        await cart.save();
        await product.save();

        res.status(200).json({ message: 'Product removed from cart and stock updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while removing the product from the cart' });
    }
};





module.exports = {
    getMyCart,
    addToCart,
    updateCart,
    removeProductFromCart,
}