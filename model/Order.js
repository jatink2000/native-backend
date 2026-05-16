// model/Orders.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userEmail: { type: String, required: true, index: true }, // User identifier
    customerName: String,
    totalAmount: Number,
    items: Array,
    status: { type: String, default: 'Processing' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

module.exports = mongoose.model('Orders', orderSchema);