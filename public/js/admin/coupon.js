
document.addEventListener("DOMContentLoaded", function () {
    setDefaultStartDate();

    const discountTypeSelect = document.getElementById("discountType");
    const maxDiscountContainer = document.getElementById("max-discount-container");

    discountTypeSelect.addEventListener("change", function () {
        if (this.value === "Percentage") {
            maxDiscountContainer.style.display = "block";
        } else {
            maxDiscountContainer.style.display = "none";
            document.getElementById("max-discount").value = "";
        }
    });
});


function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const data = {
        couponName: document.getElementsByName("couponName")[0].value.trim(),
        startDate: document.getElementsByName("startDate")[0].value,
        endDate: document.getElementsByName("endDate")[0].value,
        offerPrice: document.getElementsByName("offerPrice")[0].value,
        minimumPrice: document.getElementsByName("minimumPrice")[0].value,
        discountType: document.getElementsByName("discountType")[0].value,
        maxDiscountAmount: document.getElementsByName("maxDiscountAmount")[0].value,
    };

    fetch('/admin/createCoupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
        .then(response => {
            // Check for non-200 response
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error);
                });
            }
            return response.json();
        })
        .then(data => {
            // Show success SweetAlert
            Swal.fire({
                title: "Coupon Created",
                icon: "success",
                text: data.message,
            }).then(() => {
                location.reload();
            });
        })
        .catch(error => {

            Swal.fire({
                icon: 'error',
                title: "Oops",
                text: error.message,
            });
        });
}



function validateForm() {
    const name = document.getElementsByName("couponName")[0].value.trim();
    const startDate = document.getElementsByName("startDate")[0].value;
    const endDate = document.getElementsByName("endDate")[0].value;
    const offerPrice = parseFloat(document.getElementsByName("offerPrice")[0].value.trim());
    const minimumPrice = parseFloat(document.getElementsByName("minimumPrice")[0].value.trim());
    const discountType = document.getElementsByName("discountType")[0].value.trim();
    const maxDiscountAmount = document.getElementsByName("maxDiscountAmount")[0].value.trim()
    if (!name) {
        Swal.fire({ icon: 'error', title: 'Invalid Name', text: 'Coupon name is required.' });
        return false;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj.toString() === "Invalid Date" || endDateObj.toString() === "Invalid Date") {
        Swal.fire({ icon: 'error', title: 'Invalid Dates', text: 'Start and End Dates must be valid.' });
        return false;
    }

    if (startDateObj >= endDateObj) {
        Swal.fire({ icon: 'error', title: 'Invalid Date Range', text: 'End date must be after start date.' });
        return false;
    }

    if (isNaN(offerPrice) || isNaN(minimumPrice) || offerPrice < 0 || minimumPrice < 0) {
        Swal.fire({ icon: 'error', title: 'Invalid Prices', text: 'Prices must be non-negative numbers.' });
        return false;
    }

    if (offerPrice >= minimumPrice) {
        Swal.fire({ icon: 'error', title: 'Invalid Price Relationship', text: 'Offer price must be less than minimum price.' });
        return false;
    }

    if (discountType === "Percentage" && (offerPrice <= 0 || offerPrice > 100)) {
        Swal.fire({ icon: 'error', title: 'Invalid Percentage', text: 'Percentage must be between 1 and 100.' });
        return false;
    }

    if (discountType === "Percentage" && maxDiscountAmount && isNaN(maxDiscountAmount && (maxDiscountAmount<0||maxDiscountAmount>minimumPrice))) {
        Swal.fire({ icon: 'error', title: 'Invalid Max Discount', text: 'Max discount must be a valid number.' });
        return false;
    }

    return true;
}

function setDefaultStartDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById("startingDate").value = `${year}-${month}-${day}`;
}

function confirmDelete(couponId) {
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
    }).then((result) => {
        if (result.isConfirmed) {
            deleteCoupon(couponId);
        }
    });
}

function deleteCoupon(couponId) {
    $.ajax({
        url: `/admin/deletecoupon?id=${couponId}`,
        method: "GET",
        success: function () {
            Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "The coupon has been deleted.",
            }).then(() => {
                window.location.reload();
            });
        },
        error: function () {
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: "Failed to delete the coupon. Please try again.",
            });
        },
    });
}

document.addEventListener("DOMContentLoaded", function () {
    setDefaultStartDate();
});
