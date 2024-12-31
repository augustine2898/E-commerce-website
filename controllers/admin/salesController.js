const moment = require('moment');  
const Order = require("../../models/orderSchema");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');





const getSalesReport = async (req, res) => {
    const { dateFilter, startDate, endDate, page = 1 } = req.query;

    // Default start and end times
    let start = moment().startOf('day');
    let end = moment().endOf('day');

    // Define time ranges based on filters
    switch (dateFilter) {
        case 'daily':
            start = moment().startOf('day');
            end = moment().endOf('day');
            break;
        case 'weekly':
            start = moment().startOf('week');
            end = moment().endOf('week');
            break;
        case 'monthly':
            start = moment().startOf('month');
            end = moment().endOf('month');
            break;
        case 'yearly':
            start = moment().startOf('year');
            end = moment().endOf('year');
            break;
        case 'custom':
            if (startDate && endDate) {
                start = moment(startDate).startOf('day');
                end = moment(endDate).endOf('day');
            }
            break;
        default:
            break;
    }

    try {
        // Query to get sales data
        const salesData = await Order.find({
            createdOn: { $gte: start.toDate(), $lte: end.toDate() },
            status: { $in: ['Delivered', 'Shipped','Paid'] },
        })
            .skip((Math.max(page, 1) - 1) * 10)
            .limit(10)
            .sort({ createdOn: -1 }) // Recent orders first
            .populate('orderItems.product');

        // Aggregation for overall sales
        const overallSales = await Order.aggregate([
            {
                $match: {
                    createdOn: { $gte: start.toDate(), $lte: end.toDate() },
                    status: { $in: ['Delivered', 'Shipped','Paid'] },
                },
            },
            {
                $group: {
                    _id: null,
                    overallSalesCount: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' },
                    totalFinalAmount: { $sum: '$finalAmount' },
                    totalDiscount: { $sum: '$discount' },
                    couponDeductions: { $sum: '$couponDiscount' },
                    totalQuantity: { $sum: { $sum: '$orderItems.quantity' } }, // Total items sold
                },
            },
        ]);

        const overall = overallSales[0] || {
            overallSalesCount: 0,
            totalRevenue: 0,
            totalFinalAmount: 0,
            totalDiscount: 0,
            couponDeductions: 0,
            totalQuantity: 0,
        };

        // Total pages for pagination
        const totalOrders = await Order.countDocuments({
            createdOn: { $gte: start.toDate(), $lte: end.toDate() },
            status: { $in: ['Delivered', 'Shipped' ,'Paid'] },
        });
        const totalPages = Math.ceil(totalOrders / 10);

        // Render sales report page
        res.render('salesReport', {
            salesReport: salesData,
            overall,
            currentPage: parseInt(page, 10),
            totalPages,
            dateFilter: dateFilter || 'daily',
            startDate: startDate || '',
            endDate: endDate || '',
        });
    } catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).send('Internal Server Error');
    }
};



const downloadSalesReport = async (req, res) => {
    const { dateFilter, startDate, endDate } = req.query;

    // Default start and end times
    let start = moment().startOf('day');
    let end = moment().endOf('day');

    // Define time ranges based on filters
    switch (dateFilter) {
        case 'daily':
            start = moment().startOf('day');
            end = moment().endOf('day');
            break;
        case 'weekly':
            start = moment().startOf('week');
            end = moment().endOf('week');
            break;
        case 'monthly':
            start = moment().startOf('month');
            end = moment().endOf('month');
            break;
        case 'yearly':
            start = moment().startOf('year');
            end = moment().endOf('year');
            break;
        case 'custom':
            if (startDate && endDate) {
                start = moment(startDate).startOf('day');
                end = moment(endDate).endOf('day');
            }
            break;
        default:
            break;
    }

    try {
        // Query to get sales data
        const salesData = await Order.find({
            createdOn: { $gte: start.toDate(), $lte: end.toDate() },
            status: { $in: ['Delivered', 'Shipped', 'Paid'] },
        })
            .sort({ createdOn: -1 })
            .populate('orderItems.product');

        // Aggregation for overall sales
        const overallSales = await Order.aggregate([
            {
                $match: {
                    createdOn: { $gte: start.toDate(), $lte: end.toDate() },
                    status: { $in: ['Delivered', 'Shipped', 'Paid'] },
                },
            },
            {
                $group: {
                    _id: null,
                    overallSalesCount: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' },
                    totalDiscount: { $sum: '$discount' },
                    couponDeductions: { $sum: '$couponDiscount' },
                    totalQuantity: { $sum: { $sum: '$orderItems.quantity' } }, // Total items sold
                },
            },
        ]);

        const overall = overallSales[0] || {
            overallSalesCount: 0,
            totalRevenue: 0,
            totalDiscount: 0,
            couponDeductions: 0,
            totalQuantity: 0,
        };

        // Check for requested download format
        const format = req.query.format;

        if (format === 'excel') {
            // Create Excel file with ExcelJS
            const workbook = new ExcelJS.Workbook();
            const salesSheet = workbook.addWorksheet('Sales Report');
            const overallSheet = workbook.addWorksheet('Overall Summary');

            // Add headers for sales data
            salesSheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Order ID', key: 'orderId', width: 20 },
                { header: 'Product', key: 'product', width: 40 },
                { header: 'Quantity', key: 'quantity', width: 10 },
                { header: 'Total Order Amount', key: 'totalAmount', width: 20 },
                { header: 'Total Discount', key: 'discount', width: 20 },
                { header: 'Coupon Deduction', key: 'couponDeduction', width: 20 },
            ];

            // Populate sales data
            salesData.forEach(order => {
                order.orderItems.forEach(item => {
                    salesSheet.addRow({
                        date: moment(order.createdOn).format('YYYY-MM-DD'),
                        orderId: order._id,
                        product: item.product ? item.product.productName : 'Unknown',
                        quantity: item.quantity,
                        totalAmount: order.totalPrice.toFixed(2),
                        discount: order.discount.toFixed(2),
                        couponDeduction: order.couponDiscount.toFixed(2),
                    });
                });
            });

            // Add overall summary data
            overallSheet.addRow(['Overall Sales Count', overall.overallSalesCount]);
            overallSheet.addRow(['Total Revenue', overall.totalRevenue.toFixed(2)]);
            overallSheet.addRow(['Total Discount', overall.totalDiscount.toFixed(2)]);
            overallSheet.addRow(['Coupon Deductions', overall.couponDeductions.toFixed(2)]);
            overallSheet.addRow(['Total Quantity Sold', overall.totalQuantity]);

            // Set response headers for downloading the file
            res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Write the Excel file to the response
            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'pdf') {
            // Create PDF file with sales and overall data
            const doc = new PDFDocument();
            let fileName = 'sales-report.pdf';
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'application/pdf');

            doc.pipe(res);

            // Add PDF content
            doc.fontSize(18).text('Sales Report', { align: 'center' });
            doc.fontSize(12).text(`Date Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`, { align: 'center' });
            doc.moveDown();

            doc.fontSize(10);
            doc.text('Date | Order ID | Product | Quantity | Total Amount | Discount | Coupon Deduction');
            doc.moveDown();

            salesData.forEach(order => {
                order.orderItems.forEach(item => {
                    doc.text(`${moment(order.createdOn).format('YYYY-MM-DD')} | ${order._id} | ${item.product ? item.product.productName : 'Unknown'} | ${item.quantity} | $${order.totalPrice.toFixed(2)} | $${order.discount.toFixed(2)} | $${order.couponDiscount.toFixed(2)}`);
                });
            });

            doc.moveDown();
            doc.text('Overall Summary:');
            doc.text(`Overall Sales Count: ${overall.overallSalesCount}`);
            doc.text(`Total Revenue: $${overall.totalRevenue.toFixed(2)}`);
            doc.text(`Total Discount: $${overall.totalDiscount.toFixed(2)}`);
            doc.text(`Coupon Deductions: $${overall.couponDeductions.toFixed(2)}`);
            doc.text(`Total Quantity Sold: ${overall.totalQuantity}`);

            doc.end();

        } else {
            res.status(400).send('Invalid format. Use "excel" or "pdf"');
        }

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('Internal Server Error');
    }
};









module.exports = {
    getSalesReport,
    downloadSalesReport,
};





  
  

