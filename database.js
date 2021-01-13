require("dotenv").config();
let mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

let userSchema = new mongoose.Schema({
    email: String,
    password: String,
    createdAt: String,
    entries: Number,
    // picture: String,
    // posts: Post[],
})

let postSchema = new mongoose.Schema({
    //creator: User,
    userID: String,
    postID: String,
    date: String,
    title: String,
    content: String
})
let Post = mongoose.model("Post", postSchema);

module.exports = { mongoose, userSchema, Post };