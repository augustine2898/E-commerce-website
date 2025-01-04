async function submitForm(event) {
    event.preventDefault();
    if (!validateForm()) return;

    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/admin/addProducts', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire('Success', result.message, 'success').then(()=>{
                window.location.href = '/admin/products';
            });
        } else {
            Swal.fire('Validation Error', result.error || 'An error occurred.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Unable to add the product. Please try again.', 'error');
    }
}

async function viewImage(event, index) {
    let input = event.target;
    let reader = new FileReader();
    reader.onload = function () {
        let dataURL = reader.result;
        let image = document.getElementById("imgView" + index);
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

        let cropperContainer = document.querySelector("#croppedImg" + index).parentNode;
        cropperContainer.style.display = 'block';

        let saveButton = document.querySelector("#saveButton" + index);
        saveButton.addEventListener('click', async function () {
            let croppedCanvas = cropper.getCroppedCanvas();
            let croppedImage = document.getElementById("croppedImg" + index);
            croppedImage.src = croppedCanvas.toDataURL('image/jpeg', 1.0);

            let timestamp = new Date().getTime();
            let fileName = `cropped-img-${timestamp}-${index}.png`;

            await croppedCanvas.toBlob(blob => {
                let input = document.getElementById('input' + index);
                let imgFile = new File([blob], fileName, { type: "image/png" });
                const fileList = new DataTransfer();
                fileList.items.add(imgFile);
                input.files = fileList.files;
            });

            cropperContainer.style.display = 'none';
            cropper.destroy();
        });
    };

    reader.readAsDataURL(input.files[0]);
}

function validateForm() {
    clearErrorMessages();
    const name = document.getElementsByName('productName')[0].value;
    const description = document.getElementById('descriptionid').value;
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
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        document.getElementById('productName-error').innerText = 'Only alphabetic characters are allowed.';
        isValid = false;
    }

    // Description validation
    if (description.trim() === "") {
        document.getElementById('description-error').innerText = 'Please enter a description.';
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
        document.getElementById('color-error').innerText = 'Please enter a color.';
        isValid = false;
    }

    // Category validation
    if (category === "") {
        document.getElementById('category-error').innerText = 'Please select a category.';
        isValid = false;
    }

    // Quantity validation
    if (isNaN(quantity) || quantity < 0) {
        document.getElementById('quantity-error').innerText = 'Please enter a valid quantity.';
        isValid = false;
    }

    // Image validation
    if (images.files.length === 0) {
        Swal.fire('Validation Error', 'Please select at least one image.', 'error');
        isValid = false;
    }

    return isValid;
}

function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(message => message.innerText = '');
}
