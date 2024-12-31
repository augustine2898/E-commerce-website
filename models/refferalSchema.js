const mongoose =require("mongoose");
const {Schema} =mongoose;


const refferalschema =new Schema({
    code: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    campaign: String,
    expiration: Date,
    usageCount: { type: Number, default: 0 },
    maxUsage: { type: Number, default: 1 },

})

const Referral=mongoose.model("Referral",refferalschema);
module.exports=Referral;