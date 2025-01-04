
function handleFormSubmit(event) {
    event.preventDefault();

    // Run additional validation before continuing
    if (!validationForm()) {
        return;
    }

    const name = document.getElementById('product_name').value.trim();
    const description = document.getElementById('descriptionId').value.trim();

    fetch('/admin/addCategory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error);
                });
            }
            return response.json();
        })
        .then(data => {
            Swal.fire({
                title:"New category added",
                icon:"success",
                text: "This category as been added!",

            }).then(() => {
                        location.reload(); 
                    })
            
        })
        .catch(error => {

            Swal.fire({
                icon: 'error',
                title: "Oops",
                text: error.message
            })

        });
}

// Validation function to handle form field checks
function validationForm() {
    clearErrorMessages();

    const name = document.getElementById("product_name").value.trim();
    const description = document.getElementById("descriptionId").value.trim();
    let isValid = true;

    if (name === "") {
        displayErrorMessage("name-error", "Please enter a name");
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage("name-error", "Category name should contain only alphabetic characters");
        isValid = false;
    }

    if (description === "") {
        displayErrorMessage("description-error", "Please enter a description");
        isValid = false;
    }

    return isValid;
}

// Function to show error messages
function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.innerHTML = message;
    errorElement.style.display = "block";
}

// Function to clear any error messages displayed on the form
function clearErrorMessages() {
    const errorElements = document.getElementsByClassName("error-message");
    Array.from(errorElements).forEach((element) => {
        element.innerText = "";
        element.style.display = "none";
    });
}

async function addOffer(categoryId) {
    const { value: amount } = await Swal.fire({
        title: "Offer in percentage",
        input: "number",
        inputLabel: "Percentage",
        inoutPlaceholder: "%",
    });

    if (amount) {
        try {
            const response = await fetch("/admin/addCategoryOffer", {
                method: "POST",
                headers: {
                    'content-type': "application/json",
                },
                body: JSON.stringify({
                    percentage: amount,
                    categoryId: categoryId,
                })

            })
            const data = await response.json();
            if (response.ok && data.status === true) {
                Swal.fire(
                    "Offer added",
                    "The offerhas been added",
                    "success"

                ).then(() => {
                    location.reload();

                })
            } else {
                Swal.fire("Failed".data.message || "Adding offer failed", "error");
            }
        } catch (error) {
            Swal.fire(
                "Error",
                "An error occured while adding the offer",
                "error"
            );
            console.log("Error adding offer", error)

        }
    }
}


async function removeOffer(categoryId) {
    try {
        const response = await fetch("/admin/removeCategoryOffer", {
            method: "POST",
            headers: {
                'content-type': "application/json",
            },
            body: JSON.stringify({
                categoryId: categoryId,
            })
        })

        const data = await response.json();

        if (response.ok && data.status) {
            Swal.fire(
                " Offer removed",
                "The offer has been removed",
                "success"
            ).then(() => {
                location.reload()
            })
        } else {
            Swal.fire("Failed", data.message || "Remove offers failed", "error");
        }
    } catch (error) {
        Swal.fire(
            "Error",
            "An error occured while removing the offer",
            "error"
        );
        console.error("Error removing offer", error);
    }
}


function deleteCategory(categoryId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "This category will be permanently deleted!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Call your delete endpoint
            fetch(`/admin/removeCategory/${categoryId}`, {
                method: 'DELETE', // Use DELETE method
                headers: {
                    'Content-Type': 'application/json', // Ensure content type is JSON
                },
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || 'An error occurred');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    Swal.fire(
                        'Deleted!',
                        data.message, // Success message from your API
                        'success'
                    ).then(() => {
                        location.reload(); // Reload the page to see the changes
                    });
                })
                .catch(error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: error.message || 'An error occurred while deleting the category',
                    });
                });
        }
    });
}

function confirmToggleCategory(id, isListed) {
    const action = isListed ? 'unlist' : 'list';
    const actionText = isListed ? 'You will not be able to recover this category!' : 'You want to list this category again!';
    const confirmButtonText = isListed ? 'Yes, unlist it!' : 'Yes, list it!';
    const successMessage = isListed ? 'Your category has been unlisted.' : 'Your category has been listed again.';

    Swal.fire({
        title: 'Are you sure?',
        text: actionText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'No, keep it ' + (isListed ? 'listed' : 'unlisted')
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/${action}Category?id=${id}`, {
                method: 'GET'
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Network response was not ok');
                    }
                })
                .then(data => {
                    if (data.success) {
                        Swal.fire(successMessage, '', 'success')
                            .then(() => location.reload()); // Reload the page to see changes
                    } else {
                        Swal.fire('Error!', data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error("Error in listing/unlisting category:", error);
                    Swal.fire('Error!', 'There was a problem ' + action + 'ing the category.', 'error');
                });
        }
    });
}

//edit category script

$(document).ready(function() {
    $('#editCategoryForm').on('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        // Clear previous error messages
        clearErrorMessages();

        // Validate form
        if (!validateForm()) {
            return; // Stop if the form is invalid
        }

        const form = $(this);
        const actionUrl = form.attr('action'); // Get the form action URL
        const formData = form.serialize(); // Serialize form data

        $.ajax({
            type: 'POST',
            url: actionUrl,
            data: formData,
            success: function(response) {
                if (response.success) {
                    // Show success alert
                    Swal.fire({
                        icon: 'success',
                        title: response.message,
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        // Redirect after alert is closed
                        window.location.href = '/admin/category'; // Redirect to your desired page
                    });
                } else {
                    // Show error alert
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: response.message || 'Something went wrong!',
                    });
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON?.error || 'An error occurred';
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: errorMessage,
                });
            }
        });
    });
});

function validateForm() {
    clearErrorMessages();

    const name = document.getElementById("product_name").value.trim();
    const description = document.getElementById("descriptionId").value.trim();
    let isValid = true;

    if (name === "") {
        displayErrorMessage("name-error", "Please enter a name");
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage("name-error", "Category name should contain only alphabetic characters");
        isValid = false;
    }

    if (description === "") {
        displayErrorMessage("description-error", "Please enter a description");
        isValid = false;
    }

    return isValid; // Return true if the form is valid, otherwise false
}

function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.innerHTML = message;
    errorElement.style.display = "block";
}

function clearErrorMessages() {
    const errorElements = document.getElementsByClassName("error-message");
    Array.from(errorElements).forEach((element) => {
        element.innerText = "";
        element.style.display = "none";
    });
}