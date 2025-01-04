async function addOffer(productId) {
    const { value: amount } = await Swal.fire({
        title: 'Offer in percentage',
        input: 'number',
        inputLabel: 'Percentage',
        inputPlaceholder: '%'
    });

    $.ajax({
        url: "/admin/addProductOffer",
        method: 'POST',
        data: { id: productId, percentage: amount },
        success: function (response) {
            if (response.status) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: response.message,
                }).then(() => location.reload());
            } else {
                console.error("AJAX error:", xhr, status, error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message,
                });
            }
        },
        error: function () {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred!',
            });
        }
    });
}

function deleteProduct(productId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/admin/deleteProduct',
                method: 'POST',
                data: { id: productId },
                success: function (response) {
                    if (response.status) {
                        Swal.fire('Deleted!', response.message, 'success').then(() => location.reload());
                    } else {
                        Swal.fire('Error!', response.message, 'error');
                    }
                },
                error: function () {
                    Swal.fire('Error!', 'An error occurred while deleting the product.', 'error');
                }
            });
        }
    });
}

function confirmAction(id, isBlocked) {
    const currentPage = new URLSearchParams(window.location.search).get('page') || 1
    const action = isBlocked ? 'unblock' : 'block';
    const message = isBlocked ? 'You will unblock this product!' : 'You will block this product!';

    Swal.fire({
        title: `Are you sure you want to ${action} this product?`,
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${action} it!`
    }).then((result) => {
        if (result.isConfirmed) {
            // Redirect to the appropriate action based on isBlocked
            window.location.href = isBlocked ? `/admin/unblockProduct?id=${id}&page=${currentPage}` : `/admin/blockProduct?id=${id}&page=${currentPage}`;
        }
    });
}

function removeOffer(productId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "This will remove the offer from the product.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/admin/removeProductOffer',
                method: 'POST',
                data: { productId },
                success: function (response) {
                    if (response.status) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: response.message,
                        }).then(() => location.reload());
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: response.message,
                        });
                    }
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'An error occurred!',
                    });
                }
            });
        }
    });
}