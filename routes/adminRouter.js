const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController")
const productController = require("../controllers/admin/productController");
const { userAuth, adminAuth } = require("../middlewares/auth");
const multer =require('multer');
const storage =require("../helpers/multer");
const uploads = multer ({storage:storage});

router.get("/pageerror", adminController.pageerror);
router.get("/page404", adminController.page404);
//Login Management 
router.get("/login", adminController.loadLogin);
router.post("/login", adminController.login);
router.get("/", adminAuth, adminController.loadDashboard);
router.get("/logout", adminController.logout);

//Customer Management 
router.get("/users", adminAuth, customerController.customerinfo);
router.get("/blocKCustomer", adminAuth, customerController.customerBlocked);
router.get("/unblocKCustomer", adminAuth, customerController.customerUnblocked);

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

module.exports = router