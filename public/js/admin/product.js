
async function submitForm(event) {
    event.preventDefault(); // Prevent the default form submission
    if (!validateForm()) return; // Validate before submission

    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json(); // Expecting JSON response

        if (response.ok) {
            Swal.fire('Success', result.message, 'success').then(() => {
                window.location.href = '/admin/products'; // Redirect on success
            });
        } else {
            Swal.fire('Error', result.error || 'An error occurred.', 'error'); // Show error alert
        }
    } catch (error) {
        Swal.fire('Error', 'Unable to update the product. Please try again.', 'error');
    }
}







function validateForm() {
    let imageDatas = false
    console.log("validate form");
    clearErrorMessages();
    const name = document.getElementsByName('productName')[0].value;
    const description = document.getElementsByName('descriptionData')[0].value;
    console.log("Description:", description);
    const price = document.getElementsByName('regularPrice')[0].value;
    const saleprice = document.getElementsByName('salePrice')[0].value;
    const color = document.getElementsByName('color')[0].value;
    const category = document.getElementsByName('category')[0].value;
    const images = document.getElementById('input1');
    const quantity = document.getElementsByName('quantity')[0].value;
    let isValid = true;

    // Product Name validation
    if (name.trim() === "") {
        Swal.fire('Validation Error', 'Please enter a product name.', 'error');
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
        Swal.fire('Validation Error', 'Product name should contain only alphabetic characters.', 'error');
        isValid = false;
    }

    // Product Description validation
    if (description.trim() === "") {
        Swal.fire('Validation Error', 'Please enter a product description.', 'error');
        isValid = false;
    } else if (!/^[a-zA-Z0-9\s.,'’"#$%&'()*+/-:;<=>?@[\\\]^_`{|}~]+$/.test(description.trim())) {
        Swal.fire('Validation Error', 'Product description contains invalid characters.', 'error');
        isValid = false;
    }

    // Quantity validation
    if (parseInt(quantity) < 0 || isNaN(quantity)) {
        Swal.fire('Validation Error', 'Please enter a valid non-negative quantity.', 'error');
        isValid = false;
    }

    // Regular Price validation
    if (isNaN(price) || price <= 0) {
        document.getElementById('regularPrice-error').innerText = 'Please enter a valid regular price.';
        isValid = false;
    }

    // Sale Price validation
    if (isNaN(saleprice) || saleprice < 0) {
        document.getElementById('salePrice-error').innerText = 'Please enter a valid sale price.';
        isValid = false;
    }

    // Check if Sale Price is greater than Regular Price
    if (saleprice > price) {
        Swal.fire('Validation Error', 'Sale price must be less than regular price if an offer is applied.', 'error');
        isValid = false;
    }

    // Color validation
    if (color.trim() === "") {
        Swal.fire('Validation Error', 'Please enter a color.', 'error');
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(color.trim())) {
        Swal.fire('Validation Error', 'Color name should contain only alphabetic characters.', 'error');
        isValid = false;
    }

    // Image validation
    if (images.files.length > 0) {

    }

    return isValid;
}


function displayErrorMessage(elementId, message) {
    var errorElement = document.getElementById(elementId);
    errorElement.innerText = message;
    errorElement.style.display = "block";
}


function clearErrorMessages() {
    const errorElements = document.getElementsByClassName('error-message');
    Array.from(errorElements).forEach(element => {
        element.innerText = '';
    });
    const errorMessage = document.getElementById('errorMessage');


}




function viewImage1(event) {
    document.getElementById('imgView1').src = URL.createObjectURL(event.target.files[0])
}


function viewImage2(event) {
    document.getElementById('imgView2').src = URL.createObjectURL(event.target.files[0])
}


function viewImage3(event) {
    document.getElementById('imgView3').src = URL.createObjectURL(event.target.files[0])
}


function viewImage4(event) {
    document.getElementById('imgView4').src = URL.createObjectURL(event.target.files[0])
}




function viewImage(event, index) {
    let input = event.target;
    let reader = new FileReader();
    reader.onload = function () {
        let dataURL = reader.result;
        let image = document.getElementById('imgView' + index);
        image.src = dataURL;
        let cropper = new Cropper(image, {
            aspectRatio: NaN, // Allow free cropping
            viewMode: 2, // Keep the crop box within the image bounds
            guides: true,
            background: false,
            autoCropArea: 1, // Crop box covers the whole image initially
            movable: true, // Allow moving the image within the crop box
            zoomable: true, // Allow zooming
            scalable: true, // Allow scaling of the crop box
            cropBoxResizable: true // Allow resizing of the crop box
        });
        let cropperContainer = document.querySelector('#croppedImg' + index).parentNode;
        cropperContainer.style.display = 'block';
        let saveButton = document.querySelector('#saveButton' + index);
        saveButton.addEventListener('click', async function () {
            let croppedCanvas = cropper.getCroppedCanvas();
            let croppedImage = document.getElementById("croppedImg" + index);
            croppedImage.src = croppedCanvas.toDataURL('image/jpeg', 1.0);
            let timestamp = new Date().getTime();
            let fileName = `cropped-img-${timestamp}-${index}.png`;
            await croppedCanvas.toBlob(blob => {
                let input = document.getElementById('input' + index);
                let imgFile = new File([blob], fileName, blob)
                const fileList = new DataTransfer();
                fileList.items.add(imgFile);
                input.files = fileList.files
            });
            cropperContainer.style.display = 'none';
        });
    };
    reader.readAsDataURL(input.files[0]);
}


document.addEventListener("DOMContentLoaded", function () {
    const selectedImages = [];

    // Array of input IDs
    const inputIds = ["input1", "input2", "input3", "input4"];

    // Loop through each input ID and add an event listener
    inputIds.forEach((id) => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            inputElement.addEventListener("change", function (event) {
                handleFileSelect(event, id);
            });
        } else {
            console.error(`Element with ID '${id}' not found.`);
        }
    });
});


function handleFileSelect(event) {
    const addedImagesContainer = document.getElementById("addedImagesContainer");
    addedImagesContainer.innerHTML = "";
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        selectedImages.push(file);
        const thumbnail = document.createElement("div");
        thumbnail.classList.add("thumbnail");
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = "thumbnail";
        img.style.width = "50px";
        img.style.height = "auto";
        const removeIcon = document.createElement("span");
        removeIcon.classList.add("remove-icon");
        removeIcon.innerHTML = "&times;";
        removeIcon.addEventListener("click", function () {
            const index = selectedImages.indexOf(file);
            if (index !== -1) {
                selectedImages.splice(index, 1);
            }
            thumbnail.remove();
        });
        thumbnail.appendChild(img);
        thumbnail.appendChild(removeIcon);
        addedImagesContainer.appendChild(thumbnail);
    }
};

function deleteSingleImage(imageId, productId) {
    $.ajax({
        url: "/admin/deleteImage",
        method: 'POST',
        data: { imageNameToServer: imageId, productIdToServer: productId },
        success: ((response) => {
            if (response.status === true) {
                window.location.reload()
            }
        })
    })
}


function deleteproduct(productId) {
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
            fetch(`/admin/removeProduct/${productId}`, {
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