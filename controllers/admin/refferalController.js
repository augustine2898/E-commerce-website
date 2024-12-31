const Referral = require("../../models/refferalSchema");
const User =require("../../models/userSchema")
const mongoose =require("mongoose");

const refferal =async(req,res)=>{
    try{
        const referrals = await Referral.find({}).populate('assignedTo', 'email');
        
        const users =await User.find({isAdmin:{$ne:true}});

        return res.render("refferal",{referrals,users})
    }catch(error){
        return res.redirect("/pageerror")
    }
}

const createRefferal = async (req, res) => {
    const { assignedTo, campaign, expiration, maxUsage } = req.body;
    console.log(req.body)
    try {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const referral = new Referral({ code, assignedTo, campaign, expiration, maxUsage });
        console.log(referral)
        await referral.save();
        res.status(201).send(referral);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error generating referral code');
    }
};


const deleteReferral = async (req, res) => {
    try {
        const referralId = req.params.id;
        const deletedReferral = await Referral.findByIdAndDelete(referralId);
        if (!deletedReferral) {
            return res.status(404).json({ message: 'Referral not found' });
        }
        res.json({ message: 'Referral deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting referral' });
    }
};



module.exports={
    refferal,
    createRefferal,
    deleteReferral,
}