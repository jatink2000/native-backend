//===================================
//     Category
//===================================
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name:String,
    image:String,
    status:String,
});

module.exports = mongoose.model('Category', categorySchema);
