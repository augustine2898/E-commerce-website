function validateLoginForm() {
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const emailValue = emailInput.value.trim();
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    console.log("Validation triggered"); // Check if validation is triggered

    if (emailValue === '') {
        console.log("Email is empty"); // Log empty case
        emailError.textContent = 'Please enter your email.';
        emailError.style.display = 'block'; // Ensure error is shown
        emailInput.classList.add('is-invalid');
        return false;
    } else if (!emailValue.match(emailPattern)) {
        console.log("Email format is invalid"); // Log invalid format case
        emailError.textContent = 'Please enter a valid email address.';
        emailError.style.display = 'block';
        emailInput.classList.add('is-invalid');
        return false;
    } else {
        console.log("Email is valid"); // Log valid case
        emailError.textContent = '';
        emailError.style.display = 'none'; // Hide error message if valid
        emailInput.classList.remove('is-invalid');
        return true;
    }
}