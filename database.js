require("dotenv").config();
let mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

let userSchema = new mongoose.Schema({
    email: String,
    password: String,
})

module.exports = { mongoose, userSchema };