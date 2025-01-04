document.querySelector('#sort').addEventListener('change', (e) => {
    let url = '/shop?sort=' + e.target.value;
    ['priceMin', 'priceMax', 'category', 'status'].forEach(param => {
        const value = document.querySelector(`[name="${param}"]`)?.value;
        if (value) url += `&${param}=${value}`;
    });
    window.location.href = url;
});

document.querySelectorAll('.cart-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
        const productId = event.target.getAttribute('data-product-id');
        

        if (!userIsLoggedIn) {
            
            Swal.fire({
                title: 'Please Log In',
                text: 'You must be logged in to add items to your cart.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Log In',
                cancelButtonText: 'Cancel',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/login'; 
                }
            });
            return; 
        }

       
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
