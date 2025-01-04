const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController")
const productController = require("../controllers/admin/productController");
const orderController = require("../controllers/admin/orderController");
const couponController = require("../controllers/admin/couponController")
const refferalController=require("../controllers/admin/refferalController")
const salesController=require("../controllers/admin/salesController")
const dashboardController=require("../controllers/admin/dashboardContorller")
const { userAuth, adminAuth } = require("../middlewares/auth");

const multer =require('multer');
const storage =require("../helpers/multer");
const uploads = multer ({storage:storage});

router.get("/pageerror", adminController.pageerror);
router.get("/page404", adminController.page404);
//Login Management 
router.get("/login", adminController.loadLogin);
router.post("/login", adminController.login);
//router.get("/dashboard", adminAuth, adminController.loadDashboard);
router.get("/logout", adminController.logout);

//Customer Management 
router.get("/users", adminAuth, customerController.customerinfo);
router.get("/blockCustomer", adminAuth, customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth, customerController.customerUnblocked);

//Category Management
router.get("/category", adminAuth, categoryController.categoryInfo)
router.post("/addcategory", adminAuth, categoryController.addCategory)
router.delete("/removeCategory/:id", adminAuth, categoryController.removeCategory);
router.post("/addCategoryOffer", adminAuth, categoryController.addCategoryOffer);
router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer);
router.get("/listCategory", adminAuth, categoryController.getListCategory);
router.get("/unlistCategory", adminAuth, categoryController.getUnlistCategory);
router.get("/editCategory", adminAuth, categoryController.getEditCategory);
router.post("/editCategory/:id", adminAuth, categoryController.editCategory);



//Product Management 
router.get("/addProducts", adminAuth, productController.getProductAddPage);
router.post("/addProducts",adminAuth,uploads.array("image",4),productController.addProducts)
router.get("/products",adminAuth,productController.getAllproducts);
router.post("/addProductOffer",adminAuth,productController.addProductOffer);
router.post("/removeProductOffer",adminAuth,productController.removeProductOffer);
router.get("/blockProduct",adminAuth,productController.blockProduct);
router.get("/unblockProduct",adminAuth,productController.unblockProduct);
router.get("/editProduct",adminAuth,productController.getEditproduct)
router.post("/editProduct/:id",adminAuth,uploads.array("images",4),productController.editProduct);
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)
router.delete("/removeProduct/:id", adminAuth, productController.removeProduct);

// order Management

router.get('/order',adminAuth,orderController.getAllOrders);
router.post('/orders/updateStatus/:id',adminAuth,orderController.updateOrderStatus)


//Coupon Management 

router.get('/coupon',adminAuth,couponController.loadCoupon);
router.post("/createCoupon",adminAuth,couponController.createCoupon);
router.get("/editCoupon",adminAuth,couponController.editCoupon);
router.post("/updateCoupon",adminAuth,couponController.updateCoupon);
router.get("/deletecoupon",adminAuth,couponController.deleteCoupon);


//Refferal Management 
router.get("/refferal",adminAuth,refferalController.refferal)
router.post('/generateReferral',adminAuth,refferalController.createRefferal)
router.delete("/deleteReferral/:id",adminAuth,refferalController.deleteReferral)

//Sales Management 

router.get("/salesReport",adminAuth,salesController.getSalesReport)
router.get('/downloadSalesReport', adminAuth,salesController.downloadSalesReport);

//dashboard Management 
router.get('/dashboard',adminAuth,dashboardController.dashboard)
module.exports = router