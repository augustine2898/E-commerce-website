  // JavaScript to handle date range visibility and input validation
  document.getElementById('dateFilter').addEventListener('change', function() {
    const customDateRangeDiv = document.querySelector('.custom-date-range');
    customDateRangeDiv.style.display = this.value === 'custom' ? 'block' : 'none';
  });

  document.querySelector('form').addEventListener('submit', function(event) {
    const dateFilter = document.getElementById('dateFilter').value;
    if (dateFilter === 'custom') {
      const startDate = new Date(document.querySelector('[name="startDate"]').value);
      const endDate = new Date(document.querySelector('[name="endDate"]').value);
      if (startDate > endDate) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Date Range',
          text: 'Start date cannot be later than the end date.',
        });
        event.preventDefault();
      }
    }
  });

 // Download functionality
const setupDownload = (buttonId, format) => {
  document.getElementById(buttonId).addEventListener('click', function() {
    const dateFilter = document.getElementById('dateFilter').value;
    const startDate = document.querySelector('[name="startDate"]').value;
    const endDate = document.querySelector('[name="endDate"]').value;

    const queryParams = new URLSearchParams({
      format: format,
      dateFilter: dateFilter,
      startDate: startDate,
      endDate: endDate
    });

    Swal.fire({
      icon: 'info',
      title: `Downloading ${format.toUpperCase()}...`,
      text: 'Your sales report is being prepared.',
      showConfirmButton: false,
      timer: 1500
    });

    window.location.href = `/admin/downloadSalesReport?${queryParams.toString()}`;
  });
};

setupDownload('downloadPdfBtn', 'pdf');
setupDownload('downloadExcelBtn', 'excel');