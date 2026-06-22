const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "user"
  },
  profileImage: {
    type: String,
    default: ""
  }
})

module.exports = mongoose.model("user", userSchema)