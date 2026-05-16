//===================================
//     Products
//===================================
const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    title:String,
    weight:Number,
    category:String,
    image:String,
    unit:String,
    description:String,
    nutrientValueBenefits: { type: String, default: "" },
    storageTips: { type: String, default: "" },
    sellerName: { type: String, default: "" },
    specs: { type: Object, default: {} },
    regularPrice:Number,
    salePrice:Number,
    stockStatus:Boolean,
    productCode:String,
    productSku:String,
    status:String
});

module.exports = mongoose.model('Products', userSchema);