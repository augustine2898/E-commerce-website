document.querySelectorAll('.cart-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
        const productId = event.target.getAttribute('data-product-id');
        const quantity = 1; // You can change this value based on the input field for quantity, if applicable

        try {
            const response = await fetch('/cart/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId, quantity }), // Send quantity here
            });
            const data = await response.json();
            if (data.message === 'Product added to cart') {
                Swal.fire('Success', data.message, 'success');
            } else {
                Swal.fire('Error', data.message || 'Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Failed to add product to cart. Please try again.', 'error');
        }
    });
});


async function addToWishlist(productId) {
    console.log("Attempting to add to wishlist:", productId)
    $.ajax({

        url: '/addToWishlist',
        method: 'POST',
        data: { productId: productId },
        success: (response) => {
            if (response.status) {

                Swal.fire({
                    title: 'Added to wishlist',
                    text: 'The product has been added to your wishlist',
                    icon: 'success',
                    timer: 2000
                }).then(() => {
        window.location.reload(); 
    });
            } else {
                Swal.fire({
                    title: "Already in Wishlist",
                    text: response.message,
                    icon: 'info',
                    timer: 2000,
                })
            }
        },
        error: (error) => {
            Swal.fire({
                title: 'Error',
                text: 'There was an error adding the product to your Wishlist',
                timer: 2000
            })
        }

    })
}

