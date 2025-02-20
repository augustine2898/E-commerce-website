console.log("script loaded sucessfully")
document.getElementById('editProfileForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Clear previous error messages
    document.getElementById('nameError').style.display = 'none';
    document.getElementById('phoneError').style.display = 'none';

    const name = document.getElementById('name').value.trim(); // Get the name value
    const phone = document.getElementById('phone').value.trim(); // Get the phone value

    // Validate name: must contain at least one letter and can contain letters, numbers, and spaces
    const nameRegex = /^(?=.*[A-Za-z])[A-Za-z0-9\s]+$/; // At least one letter and allow letters, numbers, and spaces
    if (name.length < 3) {
        document.getElementById('nameError').innerText = 'Username must be at least 3 characters long.';
        document.getElementById('nameError').style.display = 'block';
        return; // Stop submission if validation fails
    } else if (!nameRegex.test(name)) {
        document.getElementById('nameError').innerText = 'Username must contain at least one letter and can include numbers and spaces.';
        document.getElementById('nameError').style.display = 'block';
        return; // Stop submission if validation fails
    }

    // Validate phone number: must be exactly 10 digits, not all zeros, and not a duplicate digit
    const phoneRegex = /^(?!.*(\d)\1{9})[0-9]{10}$/; // 10 digits, no all zeros, no repeated digits
    if (!phoneRegex.test(phone)) {
        document.getElementById('phoneError').innerText = 'Phone number must be 10 digits long and cannot be a repeated digit.';
        document.getElementById('phoneError').style.display = 'block';
        return; // Stop submission if validation fails
    }

    // Proceed with form submission if validation passes
    const response = await fetch('/edit-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // Specify that we're sending JSON
        },
        body: JSON.stringify({ name, phone }) // Convert the data to JSON
    }).catch(err => {
        console.error("Fetch error:", err);
        return null;
    });

    if (!response) {
        return; 
    }

    const result = await response.json();
    if (result.success) {
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: result.message,
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = '/userProfile'; // Redirect on success
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message
        });
    }
});