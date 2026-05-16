//===================================
//     Wishlist
//===================================
const { default: mongoose } = require("mongoose");

const wishlistSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

// Each user can wishlist the same product independently
wishlistSchema.index({ userEmail: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
