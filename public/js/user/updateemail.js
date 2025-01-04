function validateLoginForm() {
    const emailInput = document.getElementById('emailInput'); // Updated ID
    const emailError = document.getElementById('email-error');
    const emailValue = emailInput.value.trim();
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (emailValue === '') {
        emailError.textContent = 'Please enter your email.';
        emailInput.classList.add('is-invalid');
        return false;
    } else if (!emailValue.match(emailPattern)) {
        emailError.textContent = 'Please enter a valid email address.';
        emailInput.classList.add('is-invalid');
        return false;
    } else {
        emailError.textContent = '';
        emailInput.classList.remove('is-invalid');
        return true;
    }
}

const updateEmail = async (event) => {
    event.preventDefault();

    if (!validateLoginForm()) {
        return;
    }

    const email = document.getElementById('emailInput').value;
    const response = await fetch('/update-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
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
            title: 'Success',
            text: result.message,
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = '/userProfile';
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message
        });
    }
};