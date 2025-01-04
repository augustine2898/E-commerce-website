function openAddAddressPopup() {
    const modal = new bootstrap.Modal(document.getElementById('addressModal'));
    modal.show();
}



function saveNewAddress(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const newAddress = {
        addressType: document.getElementById('addressType').value,
        firstName: document.getElementById('fname').value,
        lastName: document.getElementById('lname').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('stateIn').value,
        landmark: document.getElementById('landmark').value,
        pincode: document.getElementById('zip').value,
        phone: document.getElementById('phone').value,
        altPhone: document.getElementById('altPhone').value || ''
    };

    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to save this address?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Save Address',
        cancelButtonText: 'No, Cancel',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/checkoutaddAddress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Create the new option for the address select
                        const addressSelect = document.getElementById('c_select_address');
                        const newOption = document.createElement('option');
                        newOption.value = data.newAddressId;
                        newOption.textContent = `${newAddress.address}, ${newAddress.city}, ${newAddress.state} - ${newAddress.pincode}`;
                        addressSelect.appendChild(newOption);

                        // Hide the modal after saving the address
                        const modal = bootstrap.Modal.getInstance(document.getElementById('addressModal'));
                        modal.hide();

                        // Show SweetAlert success message
                        Swal.fire({
                            title: 'Address Saved!',
                            text: data.message || 'Your new address has been successfully added.',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            // Redirect to the checkout page after the success alert
                            window.location.href = '/checkout'; // Redirect to checkout page
                        });
                    } else {
                        Swal.fire({
                            title: 'Failed to Save Address',
                            text: data.message || 'Please try again.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error',
                        text: 'Something went wrong while saving the address.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                });
        }
    });
}


function validateForm() {
    let isValid = true;
    let errorMessages = [];

    // Validate first name
    const fname = document.getElementById('fname').value.trim();
    if (!fname) {
        errorMessages.push('First name is required.');
        isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(fname)) {
        errorMessages.push('Invalid first name.');
        isValid = false;
    }

    // Validate last name
    const lname = document.getElementById('lname').value.trim();
    if (!lname) {
        errorMessages.push('Last name is required.');
        isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(lname)) {
        errorMessages.push('Invalid last name.');
        isValid = false;
    }

    //validate city

    const city = document.getElementById('city').value.trim();
    if (!lname) {
        errorMessages.push('City is required.');
        isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(city)) {
        errorMessages.push('Invalid City name.');
        isValid = false;
    }

    // Validate landmark
    const landmark = document.getElementById('landmark').value.trim();
    if (!landmark) {
        errorMessages.push('Landmark is required.');
        isValid = false;
    }

    // Validate address
    const address = document.getElementById('address').value.trim();
    if (!address) {
        errorMessages.push('Address is required.');
        isValid = false;
    }

    // Validate state
    const state = document.getElementById('stateIn').value.trim();
    if (!state) {
        errorMessages.push('State is required.');
        isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(state)) {
        errorMessages.push('Invalid state.');
        isValid = false;
    }

    // Validate zip code
    const zip = document.getElementById('zip').value.trim();
    if (!zip) {
        errorMessages.push('Zip code is required.');
        isValid = false;
    } else if (!/^\d+$/.test(zip)) {
        errorMessages.push('Invalid zip code.');
        isValid = false;
    }

    // Validate phone number
    const phone = document.getElementById('phone').value.trim();
    if (!phone) {
        errorMessages.push('Phone number is required.');
        isValid = false;
    } else if (!/^\d{10}$/.test(phone)) {
        errorMessages.push('Invalid phone number. Must be 10 digits.');
        isValid = false;
    }

    // Show SweetAlert for any validation errors
    if (!isValid) {
        Swal.fire({
            title: 'Validation Error!',
            text: errorMessages.join(' '),
            icon: 'warning',
            confirmButtonText: 'Okay'
        });
    }

    return isValid;
}



const form = document.getElementById('orderForm');


form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Check if the address is selected
    const selectedAddress = document.querySelector('#c_select_address').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value;

    if (!selectedAddress) {
        Swal.fire({
            title: 'Address Required',
            text: 'Please select an address before placing your order.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Check if the payment method is selected
    if (!paymentMethod) {
        Swal.fire({
            title: 'Payment Method Required',
            text: 'Please select a payment method to place your order.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Show a confirmation dialog before proceeding
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to place this order? You can review your order details before confirming.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Place Order',
        cancelButtonText: 'No, Cancel',
        reverseButtons: true
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/checkout/place-order', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        c_select_address: selectedAddress,
                        payment_method: paymentMethod,
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    if (paymentMethod === 'razorpay') {
                        // Trigger Razorpay payment flow
                        var options = {
                            "key": "rzp_test_BbOrMS3clwhzdK",
                            "amount": data.totalAmount * 100,
                            "currency": "INR",
                            "name": "Furni",
                            "description": "Test Transaction",
                            "order_id": data.razorpayOrderId,
                            "handler": async function (paymentResponse) {

                                const verifyResponse = await fetch('/verify-payment', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        payment: paymentResponse,
                                        order: data.orderId,
                                    }),
                                });

                                const verifyData = await verifyResponse.json();
                                if (verifyResponse.ok) {
                                    Swal.fire({
                                        title: 'Payment Successful!',
                                        text: 'Your order has been placed successfully. Redirecting to the shop page...',
                                        icon: 'success',
                                        timer: 3000,
                                        showConfirmButton: false,
                                    }).then(() => {
                                        window.location.href = `/shop`;
                                    });
                                } else {
                                    Swal.fire({
                                        title: 'Payment Verification Failed!',
                                        text: verifyData.message || 'Please try again.',
                                        icon: 'error',
                                        confirmButtonText: 'OK',
                                    });
                                }
                            },
                            "prefill": {
                                "name": "Gaurav Kumar",
                                "email": "gaurav.kumar@example.com",
                                "contact": "9000090000"
                            },
                            "theme": {
                                "color": "#3399cc"
                            },
                        };
                        const rzp1 = new Razorpay(options);
                        rzp1.open();
                        rzp1.on('payment.failed', function (paymentResponse) {
                            // Restore stock if payment fails or modal is closed
                            fetch('/restore-stock', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    orderId: data.orderId // pass the order ID for stock restoration
                                })
                            }).then(() => {
                                Swal.fire({
                                    title: 'Payment Cancelled!',
                                    text: 'Payment was not completed. Redirecting to the shop page...',
                                    icon: 'info',
                                    timer: 3000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    window.location.href = '/shop'; // Redirect to shop page
                                });
                            }).catch(err => {
                                console.error('Error restoring stock:', err);
                            });
                        });
                    } else if (paymentMethod === 'wallet' || paymentMethod === 'cash_on_delivery') {
                        Swal.fire({
                            title: 'Payment Successful!',
                            text: 'Your order has been placed successfully. Redirecting to the shop page...',
                            icon: 'success',
                            timer: 3000,
                            showConfirmButton: false,
                        }).then(() => {
                            window.location.href = `/shop`;
                        });
                    }
                } else {
                    Swal.fire({
                        title: 'Order Placement Failed!',
                        text: data.message || 'Please try again.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
                }
            } catch (error) {
                console.error('Error during order placement:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'An error occurred while placing your order. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            }
        } else {
            console.log('Order was not placed');
        }
    });
});


async function applyCoupon() {
    const couponCode = document.getElementById('coupon').value.trim();
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
            const totalPriceElement = document.getElementById('totalPrice');
            if (totalPriceElement) {
                totalPriceElement.textContent = data.finalTotal.toFixed(2);
            } else {
                console.error("Element with ID 'totalPrice' not found in the DOM.");
            }

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
    const totalPriceElement = document.getElementById('totalPrice');
    const couponFeedback = document.getElementById('couponFeedback');

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
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok) {
                if (totalPriceElement && result.finalTotal != null) {
                    totalPriceElement.textContent = `$${result.finalTotal.toFixed(2)}`;
                }

                if (couponFeedback) {
                    couponFeedback.innerHTML = `
            <div>
                <span class="text-muted">No coupon applied</span>
            </div>
        `;
                }

                Swal.fire({
                    title: 'Coupon Removed!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonText: 'OK'
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


function updateEditLink() {
    const selectedAddressId = document.querySelector('#c_select_address').value;
    const editLink = document.querySelector('#edit-address-link');

    if (selectedAddressId) {
        editLink.href = `/editAddresscheckout/${selectedAddressId}`;
        editLink.style.pointerEvents = 'auto';  // Enable clicking
        editLink.style.color = '';  // Reset to default link color
    } else {
        editLink.href = '#';
        editLink.style.pointerEvents = 'none';  // Disable clicking
        editLink.style.color = 'gray';  // Gray out the link
    }
}


function handleEditClick(event) {
    const selectedAddressId = document.querySelector('#c_select_address').value;

    if (!selectedAddressId) {
        event.preventDefault();  // Prevent navigation

        Swal.fire({
            icon: 'warning',
            title: 'Address Not Selected',
            text: 'Please select an address before editing.',
            confirmButtonText: 'OK'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateEditLink();  // Initialize the link based on the selected address

    // Attach the handleEditClick function to the edit link's click event
    const editLink = document.querySelector('#edit-address-link');
    if (editLink) {
        editLink.addEventListener('click', handleEditClick);
    }

    // Update the edit link when the address selection changes
    const addressSelect = document.querySelector('#c_select_address');
    if (addressSelect) {
        addressSelect.addEventListener('change', updateEditLink);
    }
});
