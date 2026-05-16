//===================================
//     Users
//===================================
const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  phone: Number,
});

module.exports = mongoose.model('Users', userSchema);