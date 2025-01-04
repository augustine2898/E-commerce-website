async function deleteAddress(addressId) {
    const confirmation = await Swal.fire({
      title: 'Are you sure?',
      text: 'This address will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
    });

    if (confirmation.isConfirmed) {
      try {
        const response = await fetch(`/deleteAddress/${addressId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          await Swal.fire({
            title: 'Deleted!',
            text: result.message,
            icon: 'success',
            confirmButtonText: 'Okay'
          });
          location.reload();
        } else {
          await Swal.fire({
            title: 'Error!',
            text: result.message || 'An error occurred.',
            icon: 'error',
            confirmButtonText: 'Okay'
          });
        }
      } catch (error) {
        await Swal.fire({
          title: 'Error!',
          text: 'An unexpected error occurred.',
          icon: 'error',
          confirmButtonText: 'Okay'
        });
      }
    }
  }

  async function confirmCancelOrder(event, orderId) {
    event.preventDefault();

    const confirmation = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to  cancel your order?.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
    });

    if (confirmation.isConfirmed) {
      try {
        const response = await fetch(`/cancelOrder/${orderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          await Swal.fire({
            title: 'Canceled!',
            text: result.message,
            icon: 'success',
            confirmButtonText: 'Okay'
          })
          window.location.href = "/userProfile#orders";
          window.location.reload();
          
        } else {
          await Swal.fire({
            title: 'Error!',
            text: result.message || 'An error occurred.',
            icon: 'error',
            confirmButtonText: 'Okay'
          });
        }
      } catch (error) {
        await Swal.fire({
          title: 'Error!',
          text: 'An unexpected error occurred.',
          icon: 'error',
          confirmButtonText: 'Okay'
        });
      }
    }
  }


  async function confirmReturnOrder(event, orderId) {
    event.preventDefault();

    const confirmation = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action will initiate a return process for your order.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, return it',
    });

    if (confirmation.isConfirmed) {
      try {
        const response = await fetch(`/returnOrder/${orderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          await Swal.fire({
            title: 'Returned!',
            text: result.message,
            icon: 'success',
            confirmButtonText: 'Okay'
          });
          window.location.replace= "/userProfile#orders";
        } else {
          await Swal.fire({
            title: 'Error!',
            text: result.message || 'An error occurred.',
            icon: 'error',
            confirmButtonText: 'Okay'
          });
        }
      } catch (error) {
        await Swal.fire({
          title: 'Error!',
          text: 'An unexpected error occurred.',
          icon: 'error',
          confirmButtonText: 'Okay'
        });
      }
    }
  }


  function retryPayment(orderId) {
    // Optional: Do something with the orderId if needed, like storing it for the payment process
    console.log(orderId)
    // Show the payment options modal
    var paymentModal = new bootstrap.Modal(document.getElementById('paymentOptionsPopup'));
    paymentModal.show();
  
  
        
  
  const form = document.getElementById('orderForm');
  
  
              form.addEventListener('submit', async function (e) {
                  e.preventDefault();
  
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
              // Proceed if user confirmed the order
              const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
              
              if (!paymentMethod) {
                  Swal.fire({
                      title: 'Payment Method Required',
                      text: 'Please select a payment method to place your order.',
                      icon: 'warning',
                      confirmButtonText: 'OK'
                  });
                  return;
              }
  
              const paymentMethodValue = paymentMethod.value;  
              console.log(paymentMethodValue);
  
                          try {
                              const response = await fetch(`/retryPayment/${orderId}`, {
                                  method: "POST",
                                  headers: {
                                      'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                      //c_select_address: document.querySelector('#c_select_address').value,
                                      payment_method: paymentMethodValue,
                                      
                                  })
                                  
                              });
  
                              //console.log(payment_method)
                              const data = await response.json();
                              console.log(data)
                              if (response.ok) {
                                  if (paymentMethodValue === 'razorpay') {
                                      // Trigger Razorpay payment flow
                                      var options = {
                                          "key": "rzp_test_BbOrMS3clwhzdK",
                                          "amount": data.totalAmount * 100,
                                          "currency": "INR",
                                          "name": "Furni",
                                          "description": "Test Transaction",
                                          "order_id": data.razorpayOrderId,
                                          "handler": async function (paymentResponse) {
                                              // Handle payment success
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
                                                      window.location.href = `/userProfile`;
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
                                  } else if (paymentMethodValue === 'wallet' || paymentMethodValue === 'cash_on_delivery') {
                                      Swal.fire({
                                          title: 'Payment Successful!',
                                          text: 'Your order has been placed successfully. Redirecting to the shop page...',
                                          icon: 'success',
                                          timer: 3000,
                                          showConfirmButton: false,
                                      }).then(() => {
                                          window.location.href = "/userProfile";
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
  
            }