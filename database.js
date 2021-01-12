require("dotenv").config();
let mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

let userSchema = new mongoose.Schema({
    email: String,
    password: String,
    createdAt: String,
    entries: Number,
})

let profileSchema = new mongoose.Schema({
    createdAt: String,
    entries: Number,
    // profilePicture: String,
})
let Profile = mongoose.model("Profile", profileSchema);

let postSchema = new mongoose.Schema({
    userID: String,
    postID: String,
    date: String,
    title: String,
    content: String
})
let Post = mongoose.model("Post", postSchema);

module.exports = { mongoose, userSchema, Post, Profile };