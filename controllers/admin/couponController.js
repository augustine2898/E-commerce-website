const Coupon = require("../../models/couponSchema");
const pageerror = require("../../controllers/admin/adminController")
const mongoose = require("mongoose");

//Load Coupon Page
const loadCoupon = async (req, res) => {
    try {
            const page = parseInt(req.query.page) || 1;
            const limit = 4;
            const skip = (page - 1) * limit;

        const findCoupons = await Coupon.find({}).sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit);

        const totalCoupon=await Coupon.countDocuments({})
        console.log(totalCoupon)
        const totalPages = Math.ceil(totalCoupon / limit);

        return res.render('coupon', { 
            coupons: findCoupons, 
            currentPage: page,
            totalPages: totalPages})
    } catch (error) {
        return res.redirect("/pageerror")
    }
}
//Create Coupon
const createCoupon = async (req, res) => {
  try {
    const {
      couponName,startDate,endDate,discountType,offerPrice,minimumPrice,} = req.body;
    if (!couponName || !startDate || !endDate || !discountType || !offerPrice || !minimumPrice) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const trimmedCouponName = couponName.trim();
    const start = new Date(startDate);
    const end = new Date(endDate);
    //Validation 
    if (start.toString() === "Invalid Date" || end.toString() === "Invalid Date") {
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (start >= end) {
      return res.status(400).json({ error: "Start date must be before the end date" });
    }
    const parsedOfferPrice = parseFloat(offerPrice);
    const parsedMinimumPrice = parseFloat(minimumPrice);
    if (isNaN(parsedOfferPrice) || isNaN(parsedMinimumPrice)) {
      return res.status(400).json({ error: "Offer price and minimum price must be valid numbers" });
    }
    if (parsedOfferPrice < 0 || parsedMinimumPrice < 0) {
      return res.status(400).json({ error: "Prices must be non-negative values" });
    }
    if (parsedOfferPrice >= parsedMinimumPrice && discountType === "Fixed") {
      return res.status(400).json({ error: "Fixed offer price must be less than minimum price" });
    }
    if (discountType === "Percentage" && (parsedOfferPrice <= 0 || parsedOfferPrice > 100)) {
      return res.status(400).json({ error: "Percentage discount must be between 1 and 100" });
    }
    const existingCoupon = await Coupon.findOne({
      name: { $regex: new RegExp(`^${trimmedCouponName}$`, "i") },
    });
    if (existingCoupon) {
      return res.status(409).json({ error: "Coupon with this name already exists" });
    }
    const newCoupon = new Coupon({name: trimmedCouponName,createdOn: start,expireOn: end,discountType,offerPrice: parsedOfferPrice,minimumPrice: parsedMinimumPrice,});    // Save the new coupon to the database
    await newCoupon.save();
    return res.status(201).json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};
//Edit Coupon
const editCoupon = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id)
        const findCoupon = await Coupon.findOne({ _id: id });
        console.log(findCoupon)
        res.render('coupon-edit', {
            findCoupon: findCoupon,
        });
    } catch (error) {
      console.error("Error  editing  coupon:", error);
      res.status(500).json({ error: "Server error. Please try again later." });
    }
}
//Update Coupon
const updateCoupon = async (req, res) => {
  try {
    const id = req.body.couponId;
    const objid = new mongoose.Types.ObjectId(id);
    const selectedCoupon = await Coupon.findOne({ _id: objid });

    if (selectedCoupon) {
      const startDate = new Date(req.body.startDate)
      const endDate = new Date(req.body.endDate)
      const updatedCoupon = await Coupon.updateOne(
        { _id: objid },
        {
          $set: {
            name: req.body.couponName,
            createdOn: startDate,
            expireOn: endDate,
            offerPrice: parseInt(req.body.offerPrice),
            minimumPrice: parseInt(req.body.minimumPrice),
          },
        }, { new: true }
      );
      console.log(updatedCoupon)
      if (updatedCoupon !== null) {
        res.send("Coupon updated")
      } else {
        res.status(500).send("Coupon update failed")
      }
    }
  }
  catch (error) {
    res.redirect("/pageerror")
  }
}
//Delete Coupon
const deleteCoupon= async(req,res)=>{
    try {
        const id= req.query.id;
        await Coupon.deleteOne({_id:id});
        res.status(200).send({success:true,message:"Coupon deleted sucessfully"})
    } catch (error) {
        console.error("Error deleting coupon");
        res.status(500).send({success:true,message:"Failed to delete coupon"})
    }
}

module.exports = {
    loadCoupon,
    createCoupon,
    editCoupon,
    updateCoupon,
    deleteCoupon,
}