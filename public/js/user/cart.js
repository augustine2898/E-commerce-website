async function applyCoupon() {
    const couponCode = document.getElementById('availableCoupons').value.trim();
    if (!couponCode) {
        Swal.fire({
            title: 'Error',
            text: 'Please enter a coupon code',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    try {
        const response = await fetch('/apply-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ couponCode })
        })

        const data = await response.json();

        if (response.ok) {


            Swal.fire({
                title: 'Success',
                text: `Coupon applied! Discount: $${data.discount.toFixed(2)}`,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.reload();
            })
        } else {
            Swal.fire({
                title: 'Error',
                text: data.message || 'Failed to apply coupon.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Error applying coupon:', error);
        Swal.fire({
            title: 'Error',
            text: 'An error occurred while applying the coupon.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}




async function removeCoupon() {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to remove the applied coupon?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove it!'
    });

    if (confirmation.isConfirmed) {
        try {
            const response = await fetch('/remove-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: 'Coupon Removed!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message || 'Failed to remove coupon.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error removing coupon:', error);
            Swal.fire({
                title: 'Error',
                text: 'An unexpected error occurred while removing the coupon.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
}


document.querySelectorAll('.increase').forEach(button => {
    button.addEventListener('click', async (e) => {
        const itemId = e.target.closest('tr').dataset.itemid;
        const quantityInput = e.target.closest('tr').querySelector('input[name="quantity_' + itemId + '"]');
        let newQuantity = parseInt(quantityInput.value) + 1;
        const maxQuantity = 3;  // Maximum quantity allowed

        // If new quantity exceeds max quantity, reset it to max quantity
        if (newQuantity > maxQuantity) {
            newQuantity = maxQuantity;
            Swal.fire({
                title: 'Maximum Quantity Reached',
                text: `You can only have ${maxQuantity} of this product.`,
                icon: 'info',
                confirmButtonText: 'Okay'
            });
        }

        await updateCartQuantity(itemId, newQuantity);
    });
});

// Event listener for decreasing the quantity
document.querySelectorAll('.decrease').forEach(button => {
    button.addEventListener('click', async (e) => {
        const itemId = e.target.closest('tr').dataset.itemid;
        const quantityInput = e.target.closest('tr').querySelector('input[name="quantity_' + itemId + '"]');
        let newQuantity = parseInt(quantityInput.value) - 1;

        if (newQuantity < 0) return; // Prevent negative quantities

        if (newQuantity === 0) {
            // Use SweetAlert2 to ask for confirmation before removing the item
            const confirmRemoval = await Swal.fire({
                title: 'Are you sure?',
                text: 'The quantity is zero. Do you want to remove this item from your cart?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, remove it!',
                cancelButtonText: 'No, keep it'
            });

            if (confirmRemoval.isConfirmed) {
                await updateCartQuantity(itemId, 0);
            } else {
                // Restore the original quantity if the user cancels
                quantityInput.value = 1;
            }
        } else {
            await updateCartQuantity(itemId, newQuantity);
        }
    });
});

// Function to update the cart via AJAX
async function updateCartQuantity(itemId, newQuantity) {
    try {
        const response = await fetch('/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: itemId,
                newQuantity: newQuantity,
            }),
        });
        const data = await response.json();

        if (response.ok) {
            // Update the quantity input field and the total price
            const quantityInput = document.querySelector(`input[name="quantity_${itemId}"]`);
            const totalPriceCell = document.querySelector(`tr[data-itemid="${itemId}"] .product-total`);

            if (quantityInput) {
                quantityInput.value = newQuantity;
            }

            // Find the updated item in the cart
            const updatedItem = data.cart.items.find(item => item._id == itemId);

            if (updatedItem && totalPriceCell) {
                totalPriceCell.textContent = `$${updatedItem.totalPrice ? updatedItem.totalPrice.toFixed(2) : '0.00'}`;
            }

            // Update the discount and totals from the server response
            if (data.cart) {
                document.getElementById('subtotal').textContent = `₹${data.cart.subtotal}`;
                document.getElementById('discount').textContent = `₹${data.cart.discount.toFixed(2)}`;
                document.getElementById('finalTotal').textContent = `₹${data.cart.total}`;
            }

            // If the quantity is set to 0, remove the item row
            if (newQuantity === 0) {
                const row = document.querySelector(`tr[data-itemid="${itemId}"]`);
                if (row) row.remove();
            }

        } else {
            // Error message
            Swal.fire({
                title: 'Oops!',
                text: data.message,
                icon: 'error',
                confirmButtonText: 'Try again'
            });
        }
    } catch (error) {
        console.log('Error updating cart:', error);
        Swal.fire({
            title: 'Error!',
            text: 'There was an issue updating your cart.',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    }
}
async function removeFromCart(productId) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you really want to remove this item from your cart?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove it!'
    });

    if (confirmation.isConfirmed) {
        try {
            const response = await fetch('/cart/remove', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId })
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: 'Product Removed!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message || 'Failed to remove product from cart.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'An unexpected error occurred. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
}
