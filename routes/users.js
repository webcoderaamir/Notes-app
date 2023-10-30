var mongoose = require("mongoose");
var plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/passport")

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  post: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post"
  }],
  profileimage: {
    type: String,
    default: "default.jpg"
  },
  like: {
    type: Array,
    default: []
  },
  number: Number,
})

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema)