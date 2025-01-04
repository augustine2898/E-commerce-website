function validateForm() {
    let valid = true;
    const newPass1 = document.getElementById('newPass1');
    const newPass2 = document.getElementById('newPass2');
    const newPass1Error = document.getElementById('newPass1Error');
    const newPass2Error = document.getElementById('newPass2Error');

    // Clear existing error messages
    newPass1Error.textContent = '';
    newPass2Error.textContent = '';
    newPass1Error.classList.remove('visible');
    newPass2Error.classList.remove('visible');

    // Password validation criteria
    const passval = newPass1.value;
    const cpassval = newPass2.value;

    // Validate password length
    if (passval.length < 8) {
        newPass1Error.textContent = 'Password must be at least 8 characters long.';
        newPass1Error.classList.add('visible'); // Show the error message
        valid = false;
    } else if (!/[A-Z]/.test(passval)) {
        newPass1Error.textContent = 'Password must contain at least one uppercase letter.';
        newPass1Error.classList.add('visible'); // Show the error message
        valid = false;
    } else if (!/[a-z]/.test(passval)) {
        newPass1Error.textContent = 'Password must contain at least one lowercase letter.';
        newPass1Error.classList.add('visible'); // Show the error message
        valid = false;
    } else if (!/\d/.test(passval)) {
        newPass1Error.textContent = 'Password must contain at least one number.';
        newPass1Error.classList.add('visible'); // Show the error message
        valid = false;
    } else if (!/[@$!%*?&]/.test(passval)) {
        newPass1Error.textContent = 'Password must contain at least one special character (@$!%*?&).';
        newPass1Error.classList.add('visible'); // Show the error message
        valid = false;
    }

    // Validate if passwords match
    if (passval !== cpassval) {
        newPass2Error.textContent = 'Passwords do not match.';
        newPass2Error.classList.add('visible'); // Show the error message
        valid = false;
    }

    return valid; // Prevents form submission if false
}