function setDefaultStartDate() {
    const today = new Date();
    const year = today.getFullYear();
    let month = (today.getMonth() + 1).toString().padStart(2, "0");
    let day = today.getDate().toString().padStart(2, "0");
    document.getElementById("startingDate").value = `${year}-${month}-${day}`;
  }
 
 
  function setDefaultendDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
 
 
    const year = tomorrow.getFullYear();
    let month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    let day = tomorrow.getDate().toString().padStart(2, "0");
    document.getElementById("expiringDate").value = `${year}-${month}-${day}`;
  }
 
 
  document.getElementById("coupon-form").addEventListener("submit", function(event) {
    event.preventDefault();
    if (validateForm()) {
      updateCoupon();
    }
  });
 
 
  function validateForm() {
    document.querySelectorAll(".error-message").forEach((element) => (element.innerHTML = ""));
 
 
    const sDate = document.getElementsByName("startDate")[0].value;
    const eDate = document.getElementsByName("endDate")[0].value;
    const sDateObj = new Date(sDate);
    const eDateObj = new Date(eDate);
    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);
 
 
    if (sDateObj > eDateObj) {
      document.getElementById("error-end-date").innerHTML ="End date should be after the start date";
      return false;
    }
 
 
    if (sDateObj <= todayDateObj) {
      document.getElementById("error-start-date").innerHTML ="Starting date should be greater than or equal to today's date";
      return false;
    }
 
 
    let name = document.getElementsByName("couponName")[0].value;
    const nameRegex = /^[A-Za-z0-9]{1,50}$/;
 
 
    if (!nameRegex.test(name)) {
      document.getElementById("error-coupon-name").innerHTML ="Coupon Name should only contain alphanumeric characters and be between 1 to 50 characters.";
      return false;
    }
 
 
    const offerPriceInput = document.getElementsByName("offerPrice")[0];
    const minimumPriceInput = document.getElementsByName("minimumPrice")[0];
 
 
    const offerPrice =offerPriceInput.value.trim() !== ""? parseInt(offerPriceInput.value): NaN;
    const minimumPrice =minimumPriceInput.value.trim() !== ""? parseInt(minimumPriceInput.value): NaN;
 
 
    if (isNaN(offerPrice)) {
      document.getElementById("error-offer-price").innerHTML =
        "Please enter a valid numeric value for Offer Price";
      return false;
    }
 
 
    if (isNaN(minimumPrice)) {
      document.getElementById("error-minimum-price").innerHTML ="Please enter a valid numeric value for Minimum Price";
      return false;
    }
 
 
    if (offerPrice < 0) {
      document.getElementById("error-offer-price").innerHTML ="Offer Price must be a positive number";
      return false;
    }
 
 
    if (minimumPrice < 0) {
      document.getElementById("error-minimum-price").innerHTML ="Minimum Price must be a positive number";
      return false;
    }
 
 
    if (offerPrice >= minimumPrice) {
      document.getElementById("error-offer-price").innerHTML ="Offer Price must be less than Minimum Price";
      return false;
    }
 
 
    return true;
  }
 
 
  function updateCoupon() {
  $.ajax({
    url: "/admin/updateCoupon",
    method: "post",
    data: {
      couponId: document.getElementById("coupon-id").value,
      couponName: document.getElementById("coupon-name").value,
      startDate: document.getElementById("startingDate").value,
      endDate: document.getElementById("expiringDate").value,
      offerPrice: document.getElementById("offer-price").value,
      minimumPrice: document.getElementById("minimum-price").value,
    },
    success: function(response) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Coupon updated successfully!",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.href = "/admin/coupon";
      });
    },
    error: function(xhr, status, error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update the coupon. Please try again!",
        confirmButtonText: "OK",
      });
      console.error("Error updating coupon:", error);
    },
  });
 }