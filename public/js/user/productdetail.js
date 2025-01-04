console.log('productdetail.js is loaded and running.');
document.addEventListener("DOMContentLoaded", function () {
    const quantityContainer = document.querySelector(".quantity");
    const minusBtn = quantityContainer.querySelector(".minus");
    const plusBtn = quantityContainer.querySelector(".plus");
    const inputBox = quantityContainer.querySelector(".input-box");

    function updateButtonStates() {
      const value = parseInt(inputBox.value);
      minusBtn.disabled = value <= 1;
      plusBtn.disabled = value >= parseInt(inputBox.max);
    }

    function decreaseValue() {
      let value = parseInt(inputBox.value);
      value = isNaN(value) ? 1 : Math.max(value - 1, 1);
      inputBox.value = value;
      updateButtonStates();
      console.log('Quantity decreased: ', value);
    }

    function increaseValue() {
      let value = parseInt(inputBox.value);
      value = isNaN(value) ? 1 : Math.min(value + 1, parseInt(inputBox.max));
      inputBox.value = value;
      updateButtonStates();
      console.log('Quantity increased: ', value);
    }

    minusBtn.addEventListener("click", decreaseValue);
    plusBtn.addEventListener("click", increaseValue);

    updateButtonStates();
  });

  function scrollToReviews() {
    const reviewsSection = document.getElementById('customer-reviews');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }


  let currentImageIndex = 0;


  function changeImage(index) {
    const mainImage = document.querySelector('.carousel-inner .active img');
    const newImageSrc = `/uploads/product-image/${images[index]}`;
    mainImage.src = newImageSrc;
  }

  function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    changeImage(currentImageIndex); // Call changeImage to update image
  }

  function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    changeImage(currentImageIndex); // Call changeImage to update image
  }




 document.querySelectorAll('.cart-btn').forEach(button => {
button.addEventListener('click', async (event) => {
const productId = event.target.getAttribute('data-product-id');


const quantityInput = event.target.closest('.product-info-section')?.querySelector('.input-box');

let quantity = 1; 

if (quantityInput) {
  
  quantity = parseInt(quantityInput.value) || 1; 
}


if (quantity === 0) {
  Swal.fire('Out of Stock', 'Sorry, this product is out of stock.', 'error');
  return; // Prevent further actions if quantity is zero
}

console.log("user:",userIsLoggedIn)
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity }), // Send both productId and quantity
  });

  // Check if the response was successful
  if (response.ok) {
    const data = await response.json();
    if (data.message === 'Product added to cart') {
      Swal.fire('Success', data.message, 'success');
    } else {
      Swal.fire('Error', 'Something went wrong. Please try again.', 'error');
    }
  } else {
    // If the response is not OK, assume it's an error and display the message
    const data = await response.json();
    Swal.fire('Error', data.message || 'Failed to add product to cart. Please try again.', 'error');
  }
} catch (error) {
  console.error('Error:', error);
  Swal.fire('Error', 'Failed to add product to cart. Please try again.', 'error');
}finally {
  
  if (quantityInput) {
    quantityInput.value = 1;
  }
}
});
});



async function addToWishlist(productId){
        console.log("Attempting to add to wishlist:", productId)
           $.ajax({

            url:'/addToWishlist',
            method:'POST',
            data:{productId:productId},
            success:(response)=>{
                if(response.status){

                    Swal.fire({
                        title:'Added to wishlist',
                        text:'The product has been added to your wishlist',
                        icon:'success',
                        timer:2000
                    })
                }else{
                    Swal.fire({
                        title:"Already in Wishlist",
                        text:response.message,
                        icon:'info',
                        timer:2000,
                    })
                }
            },
            error:(error)=>{
                Swal.fire({
                    title:'Error',
                    text:'There was an error adding the product to your Wishlist',
                    timer:2000
                })
            }

           }) 
        }



