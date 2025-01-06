document.getElementById('editAddressForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const addressId = this.dataset.addressId;
    console.log(addressId)
    const isValid = validateForm();

    if (isValid) {
      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(`/editAddresscheckout/${addressId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          await Swal.fire({
            title: 'Success!',
            text: result.message,
            icon: 'success',
            confirmButtonText: 'Okay'
          });
          setTimeout(() => {
            window.location.href = "/checkout";
          }, 1000);
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
  });

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

    //validate city

    const city = document.getElementById('city').value.trim();
    if (!lname) {
      errorMessages.push('City is required.');
      isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(city)) {
      errorMessages.push('Invalid City name.');
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

