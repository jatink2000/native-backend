//===================================
//     cart
//===================================

const { default: mongoose } = require("mongoose");

const cartSchema = new mongoose.Schema(
    {
        userEmail: { type: String, required: true, index: true },
        productId: { type: String, required: true },
        title: String,
        weight: Number,
        category: String,
        image: String,
        unit: String,
        description: String,
        regularPrice: Number,
        salePrice: Number,
        stockStatus: Boolean,
        productCode: String,
        productSku: String,
        status: String,
        quantity: { type: Number, default: 1 }
    },
    { timestamps: true }
);

// Each user can have the same productId in cart independently
cartSchema.index({ userEmail: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);