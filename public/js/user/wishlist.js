document.querySelectorAll('.cart-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
        const productId = event.target.getAttribute('data-product-id');
        
        if (!userIsLoggedIn) {
            // Show SweetAlert to prompt login
            Swal.fire({
                title: 'Please Log In',
                text: 'You must be logged in to add items to your cart.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Log In',
                cancelButtonText: 'Cancel',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/login'; // Redirect to login page
                }
            });
            return; // Prevent further actions if the user is not logged in
        }

        // Proceed with adding to cart
        try {
            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity: 1 }), // Default quantity is 1
            });

            // Handle response
            if (response.ok) {
                const data = await response.json();
                if (data.message === 'Product added to cart') {
                    Swal.fire('Success', data.message, 'success');
                } else {
                    Swal.fire('Error', 'Something went wrong. Please try again.', 'error');
                }
            } else {
                const data = await response.json();
                Swal.fire('Error', data.message || 'Failed to add product to cart. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Failed to add product to cart. Please try again.', 'error');
        }
    });
});


async function confirmRemove(productId) {
console.log('Remove button clicked for product ID:', productId);

Swal.fire({
title: 'Are you sure?',
text: "You won't be able to revert this",
icon: 'warning',
showCancelButton: true,
confirmButtonColor: '#3085d6',
cancelButtonColor: '#d33',
confirmButtonText: 'Yes, remove it!'
}).then((result) => {
if (result.isConfirmed) {
console.log('Confirmed removal of product with ID:', productId);
// Proceed with further logic, e.g., redirect or AJAX call
window.location.href = `/removeFromWishlist?productId=${productId}`;
} else {
console.log('Removal cancelled');
}
}).catch(error => {
console.error('Error in Swal:', error);
});
}
