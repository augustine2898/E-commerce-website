const nameid = document.getElementById("name");
const emailid = document.getElementById("email_address");
const phoneid = document.getElementById("phonenumber");
const passid = document.getElementById("password");
const cpassid = document.getElementById("confirm_password");
const error1 = document.getElementById("error1");
const error2 = document.getElementById("error2");
const error3 = document.getElementById("error3");
const error4 = document.getElementById("error4");
const error5 = document.getElementById("error5");
const signform = document.getElementById("signform");

function nameValidateChecking() {
    const nameval = nameid.value;
    const namepattern = /^[A-Za-z\s]+$/;
    if (nameval.trim() === "") {
        error1.style.display = "block";
        error1.innerHTML = "Please enter a valid name";
    } else if (!namepattern.test(nameval)) {
        error1.style.display = "block";
        error1.innerHTML = "Name can only contain alphabets and spaces";
    } else {
        error1.style.display = "none";
        error1.innerHTML = "";
    }
}

function emailValidateChecking() {
    const emailval = emailid.value;
    const emailpattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})$/;
    if (!emailpattern.test(emailval)) {
        error2.style.display = "block";
        error2.innerHTML = "Invalid Format";
    } else {
        error2.style.display = "none";
        error2.innerHTML = "";
    }
}

function phoneValidateChecking() {
    const phoneval = phoneid.value;
    if (phoneval.trim() === "") {
        error3.style.display = "block";
        error3.innerHTML = "Enter a valid Phone number";
    } else if (phoneval.length !== 10) {
        error3.style.display = "block";
        error3.innerHTML = "Enter 10 digits";
    } else {
        error3.style.display = "none";
        error3.innerHTML = "";
    }
}

function passValidateChecking() {
    const passval = passid.value;
    const cpassval = cpassid.value;
    const alpha = /[a-zA-Z]/;
    const dight = /\d/;
    const specialChar = /[@$!%*?&]/;

    if (passval.length < 8) {
        error4.style.display = "block";
        error4.innerHTML = "Password must be at least 8 characters long.";
    } else if (!/[A-Z]/.test(passval)) {
        error4.style.display = "block";
        error4.innerHTML = "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(passval)) {
        error4.style.display = "block";
        error4.innerHTML = "Password must contain at least one lowercase letter.";
    } else if (!dight.test(passval)) {
        error4.style.display = "block";
        error4.innerHTML = "Password must contain at least one number.";
    } else if (!specialChar.test(passval)) {
        error4.style.display = "block";
        error4.innerHTML = "Password must contain at least one special character (@$!%*?&).";
    } else {
        error4.style.display = "none";
        error4.innerHTML = "";
    }

    if (passval !== cpassval) {
        error5.style.display = "block";
        error5.innerHTML = "Passwords do not match.";
    } else {
        error5.style.display = "none";
        error5.innerHTML = "";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    signform.addEventListener("submit", function (e) {
        nameValidateChecking();
        emailValidateChecking();
        phoneValidateChecking();
        passValidateChecking();

        if (error1.innerHTML || error2.innerHTML || error3.innerHTML || error4.innerHTML || error5.innerHTML) {
            e.preventDefault();
        }
    });
});