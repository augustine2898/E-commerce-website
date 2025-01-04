    // Confirmation prompt and update order status with SweetAlert
    async function confirmUpdate(event, orderId) {
        event.preventDefault();

        // Confirm action with SweetAlert
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: "Do you want to update the order status?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, update it!'
        });

        if (result.isConfirmed) {
          // If confirmed, submit the request using fetch
          const form = event.target;
          const formData = new FormData(form);
          const status = formData.get('status');

          try {
            const response = await fetch(`/admin/orders/updateStatus/${orderId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status })
            });

            const data = await response.json();

            // Display success or error SweetAlert based on the response
            if (data.success) {
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: data.message,
                confirmButtonColor: '#3085d6',
                timer: 2000
              }).then(() => {
                location.reload(); // Reload the page or update UI as needed
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message,
                confirmButtonColor: '#d33'
              });
            }
          } catch (error) {
            console.error('Error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'An error occurred while updating order status.',
              confirmButtonColor: '#d33'
            });
          }
        }
      }