document.getElementById("otp").focus();

let timer = 60;
let timerInterval;

function startTimer() {
    timer = 60; // Reset timer each time
    document.getElementById("timerValue").textContent = timer;

    timerInterval = setInterval(() => {
        timer--;
        document.getElementById("timerValue").textContent = timer;

        if (timer <= 0) {
            clearInterval(timerInterval);
            document.getElementById("timerValue").classList.add("expired");
            document.getElementById("timerValue").textContent = "Expired";
            document.getElementById("otp").disabled = true;
        }
    }, 1000);
}

startTimer();

function validateOTPForm() {
    const otpInput = document.getElementById("otp").value;

    $.ajax({
        type: "POST",
        url: "/verify-otp",
        data: { otp: otpInput },
        success: function (response) {
            if (response.success) {
                Swal.fire({
                    icon: "success",
                    title: "OTP verified Successfully",
                    showConfirmButton: false,
                    timer: 1500,
                }).then(() => {
                    window.location.href = response.redirectUrl;
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: response.message,
                });
            }
        },
        error: function (xhr) {
            // Check if the response contains a JSON message
            const response = xhr.responseJSON;
            if (response && response.message) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: response.message, // Display server's message
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Invalid OTP",
                    text: "Please try again",
                });
            }
        }
    });
    return false; // Prevent form submission
}


function resendOtp() {
    clearInterval(timerInterval); // Stop any existing timer
    timer = 60; // Reset timer
    document.getElementById("otp").disabled = false;
    document.getElementById("timerValue").classList.remove("expired");

    startTimer(); // Restart timer for 60 seconds

    $.ajax({
        type: "POST",
        url: "/resend-otp",
        success: function (response) {
            if (response.success) {
                Swal.fire({
                    icon: "success",
                    title: "OTP Resend Successfully",
                    showConfirmButton: false,
                    timer: 1500,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "An error occurred while resending OTP. Please try again",
                });
            }
        }
    });
    return false;
}
