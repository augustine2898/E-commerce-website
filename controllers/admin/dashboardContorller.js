const User = require("../../models/userSchema");
const Category = require("../../models/CategorySchema");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema")

//Controller for getting data in the dashboard for admin 
const dashboard = async (req, res) => {
    try {
        const filter = req.query.filter || 'yearly';
        const today = new Date();
        let startDate;
        if (filter === 'yearly') {
            startDate = new Date(today.getFullYear(), 0, 1);
            console.log('yearly', startDate);
        } else if (filter === 'monthly') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            console.log('monthly', startDate);
        } else if (filter === 'weekly') {
            const dayOfWeek = today.getDay();
            const mondayOffset = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            startDate = new Date(today.setDate(today.getDate() + mondayOffset));
            console.log('weekly', startDate);
        } else {
            throw new Error("Invalid filter value");
        }
        const currentPage = parseInt(req.query.page) || 1;
        const itemsPerPage = 5;
        const [
            salesData,
            totalOrder,
            canceledOrdersCount,
            returnedOrdersCount,
            topProducts,
            topCategories,
            totalSalesResult,
            visitors,
            recentOrders,
            totalItems,

        ] = await Promise.all([

            Order.aggregate([
                {
                    $match: {
                        createdOn: { $gte: startDate },
                        status: { $in: ['Paid', 'Processing', 'Delivered'] },
                        $or: [
                            { paymentMethod: { $ne: 'COD' } },
                            { status: 'Delivered', paymentMethod: 'COD' }
                        ]
                    }
                },
                {
                    $group: {
                        _id: (() => {
                            if (filter === 'yearly') {
                                return { $dateToString: { format: "%Y-%m", date: "$createdOn" } }; // Group by month
                            } else if (filter === 'monthly') {
                                return {
                                    year: { $year: "$createdOn" },
                                    month: { $month: "$createdOn" },
                                }; // Group by month and year
                            } else if (filter === 'weekly') {
                                return {
                                    year: { $year: "$createdOn" },
                                    week: { $week: "$createdOn" },
                                }; // Group by week and year
                            } else {
                                throw new Error("Invalid filter value");
                            }
                        })(),
                        totalSales: { $sum: "$finalAmount" },
                    }
                },
                { $sort: { "_id": 1 } } // Sort in ascending order by date
            ]),
            Order.countDocuments({
                status: {
                    $in: [
                        'Processing',
                        'Shipped',
                        'Delivered',
                        'Canceled',
                        'Return Requested',
                        'Returned',
                        'Return Request Canceled',
                        'Paid'
                    ]
                }
            }),
            Order.countDocuments({ status: 'Canceled' }),
            Order.countDocuments({ status: 'Returned' }),

            Order.aggregate([
                { $unwind: "$orderItems" },
                {
                    $match: {
                        $or: [
                            { status: { $in: ['Paid', 'Delivered', 'Processing'] } },
                            { status: 'Delivered', paymentMethod: 'COD' }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        totalQuantity: { $sum: "$orderItems.quantity" },
                        couponDiscount: { $first: "$couponDiscount" },
                        orderItems: { $push: "$orderItems" }
                    }
                },
                { $unwind: "$orderItems" },
                {
                    $addFields: {
                        proportionalCouponDiscount: {
                            $divide: ["$couponDiscount", "$totalQuantity"]
                        }
                    }
                },
                {
                    $addFields: {
                        finalAmount: {
                            $cond: {
                                if: { $eq: ["$orderItems.appliedDiscount", 0] },
                                then: {
                                    $subtract: [
                                        { $multiply: ["$orderItems.quantity", "$orderItems.price"] },
                                        "$proportionalCouponDiscount"
                                    ]
                                },
                                else: {
                                    $subtract: [
                                        { $multiply: ["$orderItems.quantity", { $subtract: ["$orderItems.price", "$orderItems.appliedDiscount"] }] },
                                        "$proportionalCouponDiscount"
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$orderItems.product",
                        totalSales: { $sum: "$finalAmount" },
                        totalQuantity: { $sum: "$orderItems.quantity" }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        productName: "$productDetails.productName",
                        productImage: "$productDetails.productImage",
                        totalSales: 1,
                        totalQuantity: 1
                    }
                }
            ]),

            Order.aggregate([
                { $unwind: "$orderItems" },
                {
                    $match: {
                        $or: [
                            { status: { $in: ['Paid', 'Delivered', 'Processing'] } },
                            { status: 'Delivered', paymentMethod: 'COD' }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        totalQuantity: { $sum: "$orderItems.quantity" },
                        couponDiscount: { $first: "$couponDiscount" },
                        orderItems: { $push: "$orderItems" }
                    }
                },
                { $unwind: "$orderItems" },
                {
                    $addFields: {
                        proportionalCouponDiscount: {
                            $divide: ["$couponDiscount", "$totalQuantity"]
                        }
                    }
                },
                {
                    $addFields: {
                        finalAmount: {
                            $cond: {
                                if: { $eq: ["$orderItems.appliedDiscount", 0] },
                                then: {
                                    $subtract: [
                                        { $multiply: ["$orderItems.quantity", "$orderItems.price"] },
                                        "$proportionalCouponDiscount"
                                    ]
                                },
                                else: {
                                    $subtract: [
                                        { $multiply: ["$orderItems.quantity", { $subtract: ["$orderItems.price", "$orderItems.appliedDiscount"] }] },
                                        "$proportionalCouponDiscount"
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "orderItems.product",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $group: {
                        _id: "$productDetails.category",
                        totalSales: { $sum: "$finalAmount" },
                        totalQuantity: { $sum: "$orderItems.quantity" }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "categories",
                        localField: "_id",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                },
                { $unwind: "$categoryDetails" },
                {
                    $project: {
                        categoryName: "$categoryDetails.name",
                        totalSales: 1,
                        totalQuantity: 1
                    }
                }
            ]),

            Order.aggregate([
                {
                    $match: {
                        // createdOn: { $gte: startDate },
                        status: { $in: ['Paid', 'Processing', 'Delivered'] },
                        $or: [
                            { paymentMethod: { $ne: 'COD' } },
                            { status: 'Delivered', paymentMethod: 'COD' }
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: "$finalAmount" } } }
            ]),
            User.countDocuments({ isAdmin: false }),
            Order.find({
            }).populate("user", "name email")
                .populate({
                    path: "orderItems.product",
                    select: "productName category",
                    populate: {
                        path: "category",
                        select: "name"
                    }
                })
                .skip((currentPage - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .sort({ createdOn: -1 }),

            Order.countDocuments()

        ])
        
        const totalSales = totalSalesResult[0]?.total || 0;
        const formattedRecentOrders = recentOrders.map(order => {
            const user = order.user 
                ? `${order.user.name || "N/A"} (${order.user.email || "N/A"})` 
                : "N/A";
        
            const products = order.orderItems.map(item => ({
                productName: item.product?.productName || "N/A",
                category: item.product?.category?.name || "N/A"
            }));
        
            return {
                user,
                date: order.createdOn ? order.createdOn.toISOString().split("T")[0] : "N/A",
                status: order.status,
                products
            };
        });
        
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const dashboardData = {
            filter,
            salesData,
            topProducts,
            topCategories,
            currentPage,
            totalPages,
            stats: {
                visitors,
                totalSales,
                totalOrders: totalOrder,
                canceledOrdersCount,
                returnedOrdersCount,
            },
            recentOrders: formattedRecentOrders,


        };
        res.render("admin-dashboard", dashboardData);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).send("Server Error");
    }
};
// Export the functions to be used in other parts of the application
module.exports = {
    dashboard,
};


