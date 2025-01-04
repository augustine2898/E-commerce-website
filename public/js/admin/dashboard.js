// Get the filter and sales data from the data attributes
const chartContainer = document.getElementById('chart-container');
const filter = chartContainer.getAttribute('data-filter');  // Get the filter type
const salesData = JSON.parse(chartContainer.getAttribute('data-sales'));  // Parse the sales data from JSON

// Prepare labels based on the selected filter
let labels = [];
salesData.forEach(data => {
    if (filter === 'yearly') {
        // For yearly, show all months (January to December)
        const month = new Date(data._id).toLocaleString('default', { month: 'long' });
        labels.push(month);
    } else if (filter === 'monthly') {
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        labels.push(currentMonthName);
    } else if (filter === 'weekly') {
        const currentDate = new Date();
        const weekNumber = Math.ceil(currentDate.getDate() / 7);  // Calculate week of the month (1 to 4)
        const monthName = currentDate.toLocaleString('default', { month: 'long' }); // Get current month name
        const year = currentDate.getFullYear(); // Get current year
        labels.push(`Week ${weekNumber} (${monthName}, ${year})`);
    } else {
        labels.push(data._id);  // Fallback case (e.g., use the date itself)
    }
});

// Prepare data for sales corresponding to labels
const data = salesData.map(data => data.totalSales);

// Chart titles based on the filter
const chartTitle = {
    yearly: "Sales by Month",
    monthly: "Sales by Current Month",
    weekly: "Sales by Current Week"
};

// Create the chart
const ctx = document.getElementById('salesChart').getContext('2d');
const salesChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            label: chartTitle[filter],
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
    options: {
        plugins: {
            title: {
                display: true,
                text: chartTitle[filter],
                font: { size: 16 }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: filter === 'yearly' ? 'Months' : filter === 'monthly' ? 'Current Month' : 'Current Week',
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Sales (in INR)'
                }
            },
        },
    },
});
